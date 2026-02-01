import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateStage } from "@/lib/analysis/stage";
import { calculateAllFlags } from "@/lib/analysis/technical-flags";
import { StageBadge } from "@/components/analysis/stage-badge";
import { TrendBadge } from "@/components/analysis/trend-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Force dynamic because we might fetch live data/random mock data
export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return <div>Please log in</div>;
    const userId = session.user.id;

    // Fetch from DB
    const portfolioItems = await db.portfolio.findMany({
        where: { userId },
        orderBy: { quantity: 'desc' }
    });

    if (portfolioItems.length === 0) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Portfolio Health</h2>
                </div>
                <div className="flex flex-col items-center justify-center p-10 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-muted-foreground mb-4">No holdings found in your synced portfolio.</p>
                </div>
            </div>
        )
    }

    // Run analysis on each item parallelly
    // Note: Yahoo Finance requests might be rate limited. In prod, use a queue or cache.
    const analysisPromises = portfolioItems.map(async (item) => {
        try {
            const stageData = await calculateStage(item.symbol);
            const flagData = await calculateAllFlags(item.symbol);
            return { ...item, ...stageData, ...flagData };
        } catch (e) {
            return {
                ...item,
                stage: 0,
                ma200: 0,
                currentPrice: item.currentPrice,
                maSlope: "FLAT",
                insight: "Error analyzing",
                greenFlags: [],
                redFlags: [],
                greenCount: 0,
                redCount: 0,
                summary: "Error"
            };
        }
    });

    const analyzedPortfolio = await Promise.all(analysisPromises);

    // Calculate summary stats
    const stageCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalValue = 0;
    let stage2Value = 0;

    analyzedPortfolio.forEach((p: any) => {
        if (p.stage >= 1 && p.stage <= 4) stageCounts[p.stage as 1 | 2 | 3 | 4]++;
        const value = p.quantity * p.currentPrice;
        totalValue += value;
        if (p.stage === 2) stage2Value += value;
    });

    const healthScore = totalValue > 0 ? (stage2Value / totalValue) * 100 : 0;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Portfolio Health</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Portfolio Health"
                    value={`${healthScore.toFixed(0)}%`}
                    description="Assets in Stage 2 (Advancing)"
                    trend="up"
                    trendValue={healthScore > 70 ? "Healthy" : healthScore < 40 ? "Weak" : "Moderate"}
                />
                <StatCard
                    title="Stage 2 Holdings"
                    value={stageCounts[2]}
                    description="Stocks in uptrend"
                    trend="up"
                />
                <StatCard
                    title="Stage 4 Holdings"
                    value={stageCounts[4]}
                    description="Stocks in downtrend"
                    trend="down"
                    alert={stageCounts[4] > 0}
                />
                <StatCard
                    title="Transitioning"
                    value={stageCounts[1] + stageCounts[3]}
                    description="Stage 1 or 3"
                    trend="neutral"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stage & Technical Analysis</CardTitle>
                    <CardDescription>
                        Stan Weinstein's Stages combined with automated technical flags.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Symbol</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Signals</TableHead>
                                <TableHead>Trend</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analyzedPortfolio.map((stock: any) => (
                                <TableRow key={stock.symbol}>
                                    <TableCell className="font-medium">{stock.symbol}</TableCell>
                                    <TableCell>
                                        {stock.stage > 0 ? (
                                            <StageBadge stage={stock.stage} />
                                        ) : (
                                            <span className="text-muted-foreground text-sm">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell>₹{stock.currentPrice?.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 cursor-pointer">
                                                            {stock.greenCount} 🟢
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="text-xs">
                                                            <p className="font-bold mb-1">Bullish Signals</p>
                                                            {stock.greenFlags.length > 0 ? (
                                                                <ul className="list-disc pl-3">
                                                                    {stock.greenFlags.map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                                </ul>
                                                            ) : <p>None</p>}
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 cursor-pointer">
                                                            {stock.redCount} 🔴
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="text-xs">
                                                            <p className="font-bold mb-1">Bearish Signals</p>
                                                            {stock.redFlags.length > 0 ? (
                                                                <ul className="list-disc pl-3">
                                                                    {stock.redFlags.map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                                </ul>
                                                            ) : <p>None</p>}
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <TrendBadge trend={stock.maSlope} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
