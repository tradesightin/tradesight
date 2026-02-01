import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    analyzeHoldingPeriod,
    analyzeProfitPatterns,
    analyzeSectorConcentration,
    findEarlyExits
} from "@/lib/analysis/behavioral";
import { StatCard } from "@/components/dashboard/stat-card";
import { SimpleBarChart, DistributionPieChart } from "@/components/analysis/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade, Portfolio } from "@prisma/client";

// Mock Data Generator (since we might not have real data yet)
const getMockTrades = (): Trade[] => {
    return [
        { id: "1", userId: "u1", symbol: "RELIANCE", buyDate: new Date("2023-01-01"), sellDate: new Date("2023-01-20"), buyPrice: 2400, sellPrice: 2500, quantity: 10, profitLoss: 1000, holdingPeriodDays: 19, createdAt: new Date() },
        { id: "2", userId: "u1", symbol: "TCS", buyDate: new Date("2023-02-01"), sellDate: new Date("2023-02-10"), buyPrice: 3200, sellPrice: 3300, quantity: 5, profitLoss: 500, holdingPeriodDays: 9, createdAt: new Date() },
        { id: "3", userId: "u1", symbol: "INFY", buyDate: new Date("2023-03-01"), sellDate: new Date("2023-04-15"), buyPrice: 1500, sellPrice: 1400, quantity: 20, profitLoss: -2000, holdingPeriodDays: 45, createdAt: new Date() },
        { id: "4", userId: "u1", symbol: "HDFCBANK", buyDate: new Date("2023-04-01"), sellDate: new Date("2023-06-01"), buyPrice: 1600, sellPrice: 1500, quantity: 10, profitLoss: -1000, holdingPeriodDays: 61, createdAt: new Date() },
        { id: "5", userId: "u1", symbol: "ITC", buyDate: new Date("2023-05-01"), sellDate: new Date("2023-05-15"), buyPrice: 400, sellPrice: 420, quantity: 100, profitLoss: 2000, holdingPeriodDays: 14, createdAt: new Date() },
    ];
};

const getMockPortfolio = (): Portfolio[] => {
    return [
        { id: "p1", userId: "u1", symbol: "RELIANCE", quantity: 20, avgBuyPrice: 2500, currentPrice: 2600, unrealizedPL: 2000, lastUpdated: new Date() },
        { id: "p2", userId: "u1", symbol: "TCS", quantity: 10, avgBuyPrice: 3400, currentPrice: 3500, unrealizedPL: 1000, lastUpdated: new Date() },
        { id: "p3", userId: "u1", symbol: "HDFCBANK", quantity: 50, avgBuyPrice: 1600, currentPrice: 1550, unrealizedPL: -2500, lastUpdated: new Date() },
    ];
};

export default async function AnalysisPage() {
    const session = await getServerSession(authOptions);

    // In production, fetch from DB
    // const trades = await db.trade.findMany({ where: { userId: session?.user?.id } });

    // Using mock data for MVP demonstration
    const trades = getMockTrades();
    const portfolio = getMockPortfolio();

    const holdingPeriod = analyzeHoldingPeriod(trades);
    const profitPattern = analyzeProfitPatterns(trades);
    const sectorAnalysis = analyzeSectorConcentration(portfolio);

    // Note: findEarlyExits is async and uses Yahoo Finance, might be slow or fail on server
    // For demo purposes we can mock or try-catch
    let earlyExits = { missedOpportunities: [], totalMissedProfit: 0, insight: "Analysis pending..." };
    /* 
    try {
        earlyExits = await findEarlyExits(trades);
    } catch (e) { console.log(e) }
    */

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Behavioral Analysis</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Avg Win Holding"
                    value={`${holdingPeriod.avgWinDays.toFixed(0)} days`}
                    description="Time you hold winners"
                    trend="up"
                    alert={holdingPeriod.avgWinDays < 10}
                />
                <StatCard
                    title="Avg Loss Holding"
                    value={`${holdingPeriod.avgLossDays.toFixed(0)} days`}
                    description="Time you hold losers"
                    trend="down"
                    alert={holdingPeriod.ratio > 2}
                />
                <StatCard
                    title="Win Rate"
                    value={`${profitPattern.winRate.toFixed(1)}%`}
                    description="Percentage of profitable trades"
                    trend={profitPattern.winRate > 50 ? "up" : "down"}
                />
                <StatCard
                    title="Profit/Loss Ratio"
                    value={`${profitPattern.profitToLossRatio.toFixed(2)}`}
                    description="Avg Win / Avg Loss size"
                    trend={profitPattern.profitToLossRatio > 1.5 ? "up" : "neutral"}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Portfolio Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <DistributionPieChart
                            data={sectorAnalysis.sectors.map((s, i) => ({
                                name: s.name,
                                value: s.allocation,
                                color: ["#2563eb", "#16a34a", "#db2777", "#ea580c", "#8b5cf6"][i % 5]
                            }))}
                        />
                        <p className="mt-4 text-sm text-muted-foreground text-center">{sectorAnalysis.insight}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Behavioral Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <div className="flex items-center">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                                </span>
                                <p className="text-sm">{holdingPeriod.insight}</p>
                            </div>
                            <div className="flex items-center">
                                <span className={`h-2 w-2 rounded-full mr-2 ${profitPattern.profitToLossRatio < 1 ? 'bg-red-500' : 'bg-green-500'}`} />
                                <p className="text-sm">{profitPattern.insight}</p>
                            </div>
                            <div className="flex items-center">
                                <span className="h-2 w-2 rounded-full bg-slate-400 mr-2" />
                                <p className="text-sm">{earlyExits.insight}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
