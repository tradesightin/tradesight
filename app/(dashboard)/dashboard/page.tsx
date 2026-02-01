import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { calculateStage } from "@/lib/analysis/stage";
import { calculateAllFlags } from "@/lib/analysis/technical-flags";
import { analyzeHoldingPeriod } from "@/lib/analysis/behavioral";
import { StageBadge } from "@/components/analysis/stage-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Activity, TrendingUp, AlertTriangle, PlayCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) return <div>Please log in</div>;
    const userId = session.user.id;

    // 1. Fetch Summary Data
    const user = await db.user.findUnique({ where: { id: userId } });

    // 2. Fetch Portfolio (Mocked for now as per previous pages)
    const portfolioItems = [
        { symbol: "RELIANCE", quantity: 20, avgPrice: 2400, ltp: 2550 },
        { symbol: "TCS", quantity: 15, avgPrice: 3400, ltp: 3600 },
        { symbol: "TATAMOTORS", quantity: 40, avgPrice: 600, ltp: 900 },
    ];
    const trades = [
        { id: "1", userId: "u1", symbol: "RELIANCE", buyDate: new Date("2023-01-01"), sellDate: new Date("2023-01-20"), buyPrice: 2400, sellPrice: 2500, quantity: 10, profitLoss: 1000, holdingPeriodDays: 19, createdAt: new Date() },
    ]; // re-using mock trades for behavioral

    // 3. Run Analysis (Limit to top 3 holdings for dashboard speed)
    const analysisResults = await Promise.all(portfolioItems.slice(0, 3).map(async (item) => {
        try {
            const stage = await calculateStage(item.symbol);
            const flags = await calculateAllFlags(item.symbol);
            return { ...item, ...stage, ...flags };
        } catch { return null; }
    }));

    const behavioral = analyzeHoldingPeriod(trades as any[]);
    const stage2Count = analysisResults.filter(a => a?.stage === 2).length;
    const bullishCount = analysisResults.filter(a => a?.summary === "Bullish").length;

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/dashboard/simulator">
                            <PlayCircle className="mr-2 h-4 w-4" /> Open Simulator
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Portfolio Status"
                    value="3 Active"
                    description={`${stage2Count} in Stage 2`}
                    trend="up"
                />
                <StatCard
                    title="Market Pulse"
                    value={bullishCount > 0 ? "Bullish" : "Neutral"}
                    description={`${bullishCount} Strong Buy signals`}
                    trend={bullishCount > 0 ? "up" : "neutral"}
                />
                <StatCard
                    title="Behavioral Score"
                    value={behavioral.ratio > 2 ? "Review" : "Good"}
                    description={behavioral.insight.slice(0, 30) + "..."}
                    trend={behavioral.ratio > 2 ? "down" : "up"}
                />
                <StatCard
                    title="Virtual Equity"
                    value={`₹${((user as any)?.virtualBalance || 100000).toLocaleString()}`}
                    description="Paper Trading"
                    trend="neutral"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top Holdings Analysis</CardTitle>
                        <CardDescription>
                            Quick technical check on your largest positions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {analysisResults.map((item, i) => item ? (
                                <div key={i} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{item.symbol}</p>
                                        <p className="text-xs text-muted-foreground">{item.summary}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <StageBadge stage={item.stage} />
                                        <div className={`text-sm font-bold ${item.greenCount > item.redCount ? 'text-green-500' : 'text-red-500'}`}>
                                            {item.greenCount > item.redCount ? 'Bullish' : 'Bearish'}
                                        </div>
                                    </div>
                                </div>
                            ) : null)}
                        </div>
                        <div className="mt-6">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/dashboard/portfolio">View Full Portfolio <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Manage your tools.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Link href="/dashboard/alerts" className="flex items-center p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                            <AlertTriangle className="h-5 w-5 mr-3 text-amber-500" />
                            <div>
                                <div className="font-medium">Check Alerts</div>
                                <div className="text-xs text-muted-foreground">Manage price & RSI triggers</div>
                            </div>
                        </Link>
                        <Link href="/dashboard/analysis" className="flex items-center p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                            <Activity className="h-5 w-5 mr-3 text-blue-500" />
                            <div>
                                <div className="font-medium">Behavioral Report</div>
                                <div className="text-xs text-muted-foreground">Analyze your trading psychology</div>
                            </div>
                        </Link>
                        <Link href="/dashboard/simulator" className="flex items-center p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                            <TrendingUp className="h-5 w-5 mr-3 text-green-500" />
                            <div>
                                <div className="font-medium">Simulator</div>
                                <div className="text-xs text-muted-foreground">Practice newly learned strategies</div>
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
