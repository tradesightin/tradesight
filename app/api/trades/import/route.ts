import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Zerodha Console tradebook CSV columns:
// trade_date, tradingsymbol, exchange, segment, trade_type, quantity, price, order_id, trade_id, order_execution_time

function parseCSV(text: string): Record<string, string>[] {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/['"]/g, ""));
        if (values.length < headers.length) continue;
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx]; });
        rows.push(row);
    }
    return rows;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        const text = await file.text();
        const rows = parseCSV(text);

        if (rows.length === 0) {
            return NextResponse.json({ message: "CSV is empty or has no data rows" }, { status: 400 });
        }

        // Validate that it looks like a Zerodha tradebook
        const firstRow = rows[0];
        const hasSymbol = "tradingsymbol" in firstRow || "symbol" in firstRow;
        const hasTradeType = "trade_type" in firstRow || "transaction_type" in firstRow;
        if (!hasSymbol || !hasTradeType) {
            return NextResponse.json({
                message: "CSV doesn't look like a Zerodha tradebook. Expected columns: tradingsymbol, trade_type, quantity, price, trade_date"
            }, { status: 400 });
        }

        // Sort rows by date so BUYs come before SELLs chronologically
        rows.sort((a, b) => {
            const dateA = new Date(a.trade_date || a.order_execution_time || "");
            const dateB = new Date(b.trade_date || b.order_execution_time || "");
            return dateA.getTime() - dateB.getTime();
        });

        const userId = session.user.id;
        let savedCount = 0;
        let skippedCount = 0;

        for (const row of rows) {
            const symbol = row.tradingsymbol || row.symbol;
            const side = (row.trade_type || row.transaction_type || "").toUpperCase();
            const quantity = parseInt(row.quantity, 10);
            const price = parseFloat(row.price);
            const dateStr = row.trade_date || row.order_execution_time;

            if (!symbol || !side || !quantity || !price || !dateStr) {
                skippedCount++;
                continue;
            }

            // Only process equity segment
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
                // Deduplicate by checking trade_id or by symbol+price+date
                const tradeId = row.trade_id || "";
                const existing = await db.trade.findFirst({
                    where: {
                        userId,
                        symbol,
                        buyPrice: price,
                        buyDate: tradeDate,
                    }
                });

                if (!existing) {
                    await db.trade.create({
                        data: {
                            userId,
                            symbol,
                            buyDate: tradeDate,
                            buyPrice: price,
                            quantity,
                        }
                    });
                    savedCount++;
                } else {
                    skippedCount++;
                }
            } else if (side === "SELL" || side === "S") {
                // FIFO match with oldest open BUY for this symbol
                const openTrade = await db.trade.findFirst({
                    where: {
                        userId,
                        symbol,
                        sellDate: null,
                    },
                    orderBy: { buyDate: "asc" },
                });

                if (openTrade) {
                    const holdingDays = Math.floor(
                        (tradeDate.getTime() - openTrade.buyDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const profitLoss = (price - openTrade.buyPrice) * Math.min(quantity, openTrade.quantity);

                    await db.trade.update({
                        where: { id: openTrade.id },
                        data: {
                            sellDate: tradeDate,
                            sellPrice: price,
                            profitLoss,
                            holdingPeriodDays: holdingDays,
                        },
                    });
                    savedCount++;
                } else {
                    // No matching BUY found — skip
                    skippedCount++;
                }
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
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
