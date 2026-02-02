import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { decryptToken, fetchHoldings } from "@/lib/zerodha";
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

        const holdings = await fetchHoldings(user.zerodhaAccessToken);

        // Update Portfolio in DB
        // Simple implementation: Delete old, insert new (for full sync)
        // In production, you might want to upsert to preserve history if tracking day-wise
        await db.$transaction(async (tx: any) => {
            await tx.portfolio.deleteMany({
                where: { userId: user.id },
            });

            for (const holding of holdings) {
                await tx.portfolio.create({
                    data: {
                        userId: user.id,
                        symbol: holding.tradingsymbol,
                        quantity: holding.quantity,
                        avgBuyPrice: holding.average_price,
                        currentPrice: holding.last_price,
                        unrealizedPL: holding.pnl,
                    },
                });
            }
        });

        return NextResponse.json({ message: "Portfolio synced successfully", count: holdings.length });
    } catch (error: any) {
        console.error("Sync error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
