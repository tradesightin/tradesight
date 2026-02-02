import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Helper: Parse CSV Line handling quoted values (e.g., "Reliance Industries, Ltd")
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuote = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') { 
            inQuote = !inQuote; 
        } else if (char === ',' && !inQuote) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result.map(c => c.replace(/^"|"$/g, '')); // Remove surrounding quotes
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        const text = await file.text();
        // Remove Byte Order Mark (BOM) if present
        const cleanText = text.replace(/^\uFEFF/, '');
        const lines = cleanText.trim().split("\n");
        
        if (lines.length < 2) {
            return NextResponse.json({ message: "CSV is empty" }, { status: 400 });
        }

        // Parse Headers
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const rows: any[] = [];

        // Parse Body
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length < headers.length) continue;
            
            const row: any = {};
            headers.forEach((h, idx) => { row[h] = values[idx]; });
            rows.push(row);
        }

        // Validate Columns
        const firstRow = rows[0];
        const hasSymbol = "tradingsymbol" in firstRow || "symbol" in firstRow;
        const hasTradeType = "trade_type" in firstRow || "transaction_type" in firstRow; 
        
        if (!hasSymbol || !hasTradeType) {
            return NextResponse.json({ 
                message: "Invalid CSV format. Expected columns: tradingsymbol, trade_type/transaction_type, quantity, price, trade_date" 
            }, { status: 400 });
        }

        // Sort CSV chronologically
        rows.sort((a: any, b: any) => {
            const dA = new Date(a.trade_date || a.order_execution_time);
            const dB = new Date(b.trade_date || b.order_execution_time);
            return dA.getTime() - dB.getTime();
        });

        const userId = session.user.id;
        
        // --- OPTIMIZATION: Fetch existing trades once ---
        const existingTrades = await db.trade.findMany({
            where: { userId },
            orderBy: { buyDate: 'asc' }
        });

        // Build In-Memory State for FIFO Matching
        // Map: Symbol -> Array of Open Trades (Mutable)
        const openTradesMap: Record<string, any[]> = {};
        
        // 1. Populate map with existing DB trades that are OPEN
        existingTrades.forEach((t: any) => {
            if (!t.sellDate) {
                if (!openTradesMap[t.symbol]) openTradesMap[t.symbol] = [];
                openTradesMap[t.symbol].push({ ...t, isDbRecord: true });
            }
        });

        // Operations to perform - typed STRICTLY as PrismaPromise array
        const ops: Prisma.PrismaPromise<any>[] = [];
        let savedCount = 0;
        let skippedCount = 0;

        // 2. Process CSV Rows against Memory State
        for (const row of rows) {
            const symbol = row.tradingsymbol || row.symbol;
            const rawSide = row.trade_type || row.transaction_type || "";
            const side = rawSide.toUpperCase();
            const quantity = Math.abs(parseInt(row.quantity));
            const price = parseFloat(row.price);
            const dateStr = row.trade_date || row.order_execution_time;

            if (!symbol || !side || !quantity || !price || !dateStr) {
                skippedCount++;
                continue;
            }

            // Filter Equity only
            const segment = (row.segment || "").toUpperCase();
            if (segment && !segment.includes("EQ") && !segment.includes("NSE") && !segment.includes("BSE")) {
                skippedCount++;
                continue;
            }

            const tradeDate = new Date(dateStr);
            if (isNaN(tradeDate.getTime())) {
                skippedCount++;
                continue;
            }

            if (side === "BUY" || side === "B") {
                // Check Duplicates
                const isDuplicate = existingTrades.some((t: any) => 
                    t.symbol === symbol && 
                    t.buyPrice === price && 
                    t.quantity === quantity &&
                    t.buyDate.getTime() === tradeDate.getTime()
                );

                if (!isDuplicate) {
                    // Create New Trade Operation
                    const newTradeId = `new_${Date.now()}_${Math.random()}`; 
                    const newTrade = {
                        id: newTradeId,
                        userId,
                        symbol,
                        buyDate: tradeDate,
                        buyPrice: price,
                        quantity,
                        sellDate: null,
                        sellPrice: null,
                        profitLoss: null,
                        isDbRecord: false 
                    };

                    ops.push(db.trade.create({
                        data: {
                            userId,
                            symbol,
                            buyDate: tradeDate,
                            buyPrice: price,
                            quantity
                        }
                    }));
                    
                    if (!openTradesMap[symbol]) openTradesMap[symbol] = [];
                    openTradesMap[symbol].push(newTrade);
                    
                    savedCount++;
                } else {
                    skippedCount++;
                }

            } else if (side === "SELL" || side === "S") {
                let quantityToSell = quantity;
                const openPositions = openTradesMap[symbol] || [];

                while (quantityToSell > 0 && openPositions.length > 0) {
                    const match = openPositions[0]; // Oldest first
                    
                    const holdingDays = Math.floor(
                        (tradeDate.getTime() - new Date(match.buyDate).getTime()) / (1000 * 60 * 60 * 24)
                    );

                    if (match.quantity <= quantityToSell) {
                        // FULL MATCH
                        const pl = (price - match.buyPrice) * match.quantity;

                        if (match.isDbRecord) {
                            ops.push(db.trade.update({
                                where: { id: match.id },
                                data: {
                                    sellDate: tradeDate,
                                    sellPrice: price,
                                    profitLoss: pl,
                                    holdingPeriodDays: holdingDays
                                }
                            }));
                        } 

                        openPositions.shift();
                        quantityToSell -= match.quantity;
                        savedCount++;

                    } else {
                        // PARTIAL MATCH
                        const soldQty = quantityToSell;
                        const remainingQty = match.quantity - soldQty;
                        const pl = (price - match.buyPrice) * soldQty;

                        if (match.isDbRecord) {
                            // OP 1: Reduce quantity of original trade
                            ops.push(db.trade.update({
                                where: { id: match.id },
                                data: { quantity: remainingQty }
                            }));

                            // OP 2: Create NEW Closed Trade for sold portion
                            ops.push(db.trade.create({
                                data: {
                                    userId,
                                    symbol,
                                    buyDate: match.buyDate,
                                    buyPrice: match.buyPrice,
                                    quantity: soldQty,
                                    sellDate: tradeDate,
                                    sellPrice: price,
                                    profitLoss: pl,
                                    holdingPeriodDays: holdingDays
                                }
                            }));
                        }
                        
                        match.quantity = remainingQty;
                        quantityToSell = 0;
                        savedCount++;
                    }
                }
            }
        }

        // 3. Execute Operations in Transaction
        const BATCH_SIZE = 50;
        for (let i = 0; i < ops.length; i += BATCH_SIZE) {
            const batch = ops.slice(i, i + BATCH_SIZE);
            if (batch.length > 0) {
                await db.$transaction(batch);
            }
        }

        return NextResponse.json({
            message: "Import complete",
            count: savedCount,
            skipped: skippedCount,
            total: rows.length,
        });

    } catch (error: any) {
        console.error("Trade import error:", error);
        return NextResponse.json(
            { message: error.message || "An internal server error occurred" }, 
            { status: 500 }
        );
    }
}
