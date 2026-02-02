import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { fetchTradeHistory } from "@/lib/zerodha";
import { db } from "@/lib/db";

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user?.zerodhaAccessToken) {
            return NextResponse.json(
                { message: "Zerodha not connected" },
                { status: 400 }
            );
        }

        const orders = await fetchTradeHistory(user.zerodhaAccessToken, "", "");

        let savedCount = 0;

        for (const order of orders) {
            const symbol = order.tradingsymbol;
            const orderDate = new Date(order.order_timestamp);
            const price = order.average_price;
            const quantity = order.quantity;
            const side = order.transaction_type; // BUY or SELL

            if (side === "BUY") {
                // Check for duplicate
                const existing = await db.trade.findFirst({
                    where: {
                        userId: user.id,
                        symbol,
                        buyPrice: price,
                        buyDate: orderDate,
                    }
                });

                if (!existing) {
                    await db.trade.create({
                        data: {
                            userId: user.id,
                            symbol,
                            buyDate: orderDate,
                            buyPrice: price,
                            quantity,
                        }
                    });
                    savedCount++;
                }
            } else if (side === "SELL") {
                // Match with oldest open trade for this symbol (FIFO)
                const openTrade = await db.trade.findFirst({
                    where: {
                        userId: user.id,
                        symbol,
                        sellDate: null,
                    },
                    orderBy: { buyDate: 'asc' },
                });

                if (openTrade) {
                    const holdingDays = Math.floor(
                        (orderDate.getTime() - openTrade.buyDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const profitLoss = (price - openTrade.buyPrice) * Math.min(quantity, openTrade.quantity);

                    await db.trade.update({
                        where: { id: openTrade.id },
                        data: {
                            sellDate: orderDate,
                            sellPrice: price,
                            profitLoss,
                            holdingPeriodDays: holdingDays,
                        },
                    });
                    savedCount++;
                }
            }
        }

        return NextResponse.json({ message: "Trades synced", count: savedCount });
    } catch (error: any) {
        console.error("Trade sync error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
