import { db } from "@/lib/db";
import yahooFinance from "yahoo-finance2";

export async function executeVirtualTrade(
    userId: string,
    symbol: string,
    quantity: number,
    type: "BUY" | "SELL"
) {
    const querySymbol = symbol.endsWith(".NS") ? symbol : `${symbol}.NS`;

    // 1. Fetch live price
    const quote = await yahooFinance.quote(querySymbol);
    const price = (quote as any).regularMarketPrice;

    if (!price) throw new Error("Could not fetch price for symbol");

    const totalValue = price * quantity;

    // 2. Transaction
    return await db.$transaction(async (tx: any) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        if (type === "BUY") {
            if ((user.virtualBalance || 0) < totalValue) {
                throw new Error(`Insufficient virtual balance. Required: ${totalValue.toFixed(2)}, Available: ${user.virtualBalance}`);
            }

            // Deduct Balance
            await tx.user.update({
                where: { id: userId },
                data: { virtualBalance: { decrement: totalValue } }
            });

            // Update Portfolio
            const existing = await tx.virtualPortfolio.findFirst({
                where: { userId, symbol }
            });

            if (existing) {
                const newQty = existing.quantity + quantity;
                const newAvg = ((existing.avgBuyPrice * existing.quantity) + totalValue) / newQty;

                await tx.virtualPortfolio.update({
                    where: { id: existing.id },
                    data: { quantity: newQty, avgBuyPrice: newAvg }
                });
            } else {
                await tx.virtualPortfolio.create({
                    data: { userId, symbol, quantity, avgBuyPrice: price }
                });
            }

        } else if (type === "SELL") {
            const existing = await tx.virtualPortfolio.findFirst({
                where: { userId, symbol }
            });

            if (!existing || existing.quantity < quantity) {
                throw new Error("Insufficient holdings to sell");
            }

            // Add Balance
            await tx.user.update({
                where: { id: userId },
                data: { virtualBalance: { increment: totalValue } }
            });

            // Update Portfolio
            if (existing.quantity === quantity) {
                await tx.virtualPortfolio.delete({ where: { id: existing.id } });
            } else {
                await tx.virtualPortfolio.update({
                    where: { id: existing.id },
                    data: { quantity: existing.quantity - quantity }
                });
            }
        }

        // Log Trade
        await tx.virtualTrade.create({
            data: {
                userId,
                symbol,
                type,
                quantity,
                price,
                totalValue
            }
        });

        return { success: true, price, totalValue };
    });
}

export async function getVirtualPortfolio(userId: string) {
    const portfolio = await (db as any).virtualPortfolio.findMany({ where: { userId } });
    // Fetch live prices to calculate P&L
    // Optimization: Batch request

    const enriched = await Promise.all(portfolio.map(async (p: any) => {
        try {
            // Mocking live price to avoid API spam if needed, or real fetch
            // const quote = await yahooFinance.quote(p.symbol + ".NS");
            // const currentPrice = quote.regularMarketPrice || p.avgBuyPrice;

            // For reliable MVP speed:
            const currentPrice = await fetchLivePrice(p.symbol);
            const currentValue = p.quantity * currentPrice;
            const pnl = currentValue - (p.quantity * p.avgBuyPrice);

            return { ...p, currentPrice, currentValue, pnl };
        } catch {
            return { ...p, currentPrice: p.avgBuyPrice, currentValue: p.quantity * p.avgBuyPrice, pnl: 0 };
        }
    }));

    return enriched;
}

// Helper to avoid heavy load
async function fetchLivePrice(symbol: string) {
    // In production, use cached prices or batch
    const quote = await yahooFinance.quote(symbol.endsWith(".NS") ? symbol : `${symbol}.NS`);
    return (quote as any).regularMarketPrice || 0;
}
