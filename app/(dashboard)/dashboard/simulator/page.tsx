import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { executeVirtualTrade, getVirtualPortfolio } from "@/lib/simulator/engine";
import {
    simulateStopLossFromTrades,
    simulateTargetProfit,
    simulateStopLossWithTarget,
} from "@/lib/simulator/strategies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { revalidatePath } from "next/cache";
import { FlaskConical, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SimulatorPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return <div>Access Denied</div>;

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    const trades = await db.trade.findMany({
        where: { userId: session.user.id },
        orderBy: { buyDate: 'desc' },
        take: 100,
    });

    // Paper trading action
    async function tradeAction(formData: FormData) {
        "use server";
        const sess = await getServerSession(authOptions);
        const symbol = formData.get("symbol") as string;
        const quantity = parseInt(formData.get("quantity") as string);
        const type = formData.get("type") as "BUY" | "SELL";
        if (!sess?.user?.id) return;
        try {
            await executeVirtualTrade(sess.user.id, symbol, quantity, type);
            revalidatePath("/dashboard/simulator");
        } catch (e: any) {
            console.error("Trade failed", e.message);
        }
    }

    // Fetch virtual portfolio
    let portfolio: any[] = [];
    try {
        portfolio = await getVirtualPortfolio(session.user.id);
    } catch (e) { console.log(e); }

    const balance = user?.virtualBalance || 100000;
    const portfolioValue = portfolio.reduce((acc: number, p: any) => acc + (p.currentValue || 0), 0);
    const totalEquity = balance + portfolioValue;
    const totalPnl = totalEquity - 100000;
    const pnlColor = totalPnl >= 0 ? "text-green-600" : "text-red-600";

    // What-If simulations (only if trades exist)
    const completedTrades = trades.filter((t: any) => t.sellDate && t.sellPrice);
    const hasTradeData = completedTrades.length >= 1;

    const stopLoss10 = hasTradeData ? simulateStopLossFromTrades(trades, 10) : null;
    const stopLoss15 = hasTradeData ? simulateStopLossFromTrades(trades, 15) : null;
    const target20 = hasTradeData ? simulateTargetProfit(trades, 20) : null;
    const combo = hasTradeData ? simulateStopLossWithTarget(trades, 10, 25) : null;

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Simulator</h2>
            </div>

            <Tabs defaultValue="whatif" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="whatif">What-If Analysis</TabsTrigger>
                    <TabsTrigger value="paper">Paper Trading</TabsTrigger>
                </TabsList>

                {/* ===== WHAT-IF SIMULATOR TAB ===== */}
                <TabsContent value="whatif" className="space-y-4">
                    {!hasTradeData ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <FlaskConical className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No completed trades found</h3>
                                <p className="text-sm text-muted-foreground max-w-md">
                                    The What-If simulator tests different strategies on your past trades.
                                    Connect Zerodha and sync your trade history to use this feature.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                See how different strategies would have affected your past {completedTrades.length} completed trade(s). All calculations are based on your actual trade history.
                            </p>

                            <div className="grid gap-4 md:grid-cols-2">
                                {stopLoss10 && (
                                    <SimCard
                                        title="10% Stop Loss"
                                        description="What if you always cut losses at -10%?"
                                        result={stopLoss10}
                                    />
                                )}
                                {stopLoss15 && (
                                    <SimCard
                                        title="15% Stop Loss"
                                        description="What if you always cut losses at -15%?"
                                        result={stopLoss15}
                                    />
                                )}
                                {target20 && (
                                    <SimCard
                                        title="20% Target Exit"
                                        description="What if you always booked profits at +20%?"
                                        result={target20}
                                    />
                                )}
                                {combo && (
                                    <SimCard
                                        title="10% SL + 25% Target"
                                        description="Disciplined approach: limit losses, lock profits."
                                        result={combo}
                                        highlight
                                    />
                                )}
                            </div>

                            {combo && combo.details.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Trade-by-Trade Breakdown (10% SL + 25% Target)</CardTitle>
                                        <CardDescription>How each trade would have been different.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Symbol</TableHead>
                                                    <TableHead>Actual P&L</TableHead>
                                                    <TableHead>Simulated P&L</TableHead>
                                                    <TableHead className="hidden sm:table-cell">Reason</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {combo.details.map((d, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium">{d.symbol}</TableCell>
                                                        <TableCell className={d.originalPL >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            {d.originalPL >= 0 ? '+' : ''}{d.originalPL.toFixed(1)}%
                                                        </TableCell>
                                                        <TableCell className={d.simulatedPL >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            {d.simulatedPL >= 0 ? '+' : ''}{d.simulatedPL.toFixed(1)}%
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{d.exitReason}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}

                            <p className="text-xs text-muted-foreground text-center">
                                This simulation uses your actual trade data. Past patterns do not guarantee future results.
                            </p>
                        </>
                    )}
                </TabsContent>

                {/* ===== PAPER TRADING TAB ===== */}
                <TabsContent value="paper" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Equity"
                            value={`₹${totalEquity.toLocaleString()}`}
                            description="Cash + Holdings"
                        />
                        <StatCard
                            title="Cash Balance"
                            value={`₹${balance.toLocaleString()}`}
                            description="Available to trade"
                        />
                        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                            <div className="text-sm font-medium text-muted-foreground">Total P&L</div>
                            <div className={`text-2xl font-bold ${pnlColor}`}>
                                {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString()}
                            </div>
                            <div className={`text-xs ${pnlColor}`}>
                                {((totalPnl / 100000) * 100).toFixed(2)}% All Time
                            </div>
                        </div>
                        <StatCard
                            title="Holdings"
                            value={portfolio.length}
                            description="Virtual stocks"
                            trend="neutral"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Your Holdings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Symbol</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Avg Price</TableHead>
                                            <TableHead>LTP</TableHead>
                                            <TableHead>P&L</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {portfolio.map((p: any) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-medium">{p.symbol}</TableCell>
                                                <TableCell>{p.quantity}</TableCell>
                                                <TableCell>₹{p.avgBuyPrice.toFixed(2)}</TableCell>
                                                <TableCell>₹{p.currentPrice?.toFixed(2)}</TableCell>
                                                <TableCell className={p.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                                                    {p.pnl >= 0 ? "+" : ""}₹{p.pnl.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {portfolio.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                    No holdings yet. Place a virtual trade to get started.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Place Order</CardTitle>
                                <CardDescription>Execute a virtual trade with real-time prices.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="buy" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="buy">Buy</TabsTrigger>
                                        <TabsTrigger value="sell">Sell</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="buy">
                                        <form action={tradeAction} className="space-y-4 pt-4">
                                            <input type="hidden" name="type" value="BUY" />
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="buy-symbol">Symbol</Label>
                                                <Input id="buy-symbol" name="symbol" placeholder="e.g. RELIANCE" required className="uppercase" />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="buy-quantity">Quantity</Label>
                                                <Input id="buy-quantity" name="quantity" type="number" min="1" placeholder="1" required />
                                            </div>
                                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                                <TrendingUp className="mr-2 h-4 w-4" /> Buy Stocks
                                            </Button>
                                        </form>
                                    </TabsContent>

                                    <TabsContent value="sell">
                                        <form action={tradeAction} className="space-y-4 pt-4">
                                            <input type="hidden" name="type" value="SELL" />
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="sell-symbol">Symbol</Label>
                                                <Input id="sell-symbol" name="symbol" placeholder="e.g. RELIANCE" required className="uppercase" />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="sell-quantity">Quantity</Label>
                                                <Input id="sell-quantity" name="quantity" type="number" min="1" placeholder="1" required />
                                            </div>
                                            <Button variant="destructive" className="w-full">
                                                <TrendingDown className="mr-2 h-4 w-4" /> Sell Stocks
                                            </Button>
                                        </form>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Reusable simulation result card component
function SimCard({ title, description, result, highlight }: {
    title: string;
    description: string;
    result: { originalPL: number; simulatedPL: number; difference: number; tradesAffected: number; totalTrades: number };
    highlight?: boolean;
}) {
    return (
        <Card className={highlight ? "border-primary/20" : ""}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground">Actual P&L</p>
                        <p className={`text-lg font-bold ${result.originalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.originalPL >= 0 ? '+' : ''}{result.originalPL.toFixed(1)}%
                        </p>
                    </div>
                    <div className="flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Simulated</p>
                        <p className={`text-lg font-bold ${result.simulatedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.simulatedPL >= 0 ? '+' : ''}{result.simulatedPL.toFixed(1)}%
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs border-t pt-2">
                    <span className="text-muted-foreground">{result.tradesAffected} of {result.totalTrades} trades affected</span>
                    <Badge variant={result.difference >= 0 ? "secondary" : "destructive"} className={result.difference >= 0 ? "bg-green-50 text-green-700" : ""}>
                        {result.difference >= 0 ? '+' : ''}{result.difference.toFixed(1)}%
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
