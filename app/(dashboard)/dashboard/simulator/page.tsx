import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { executeVirtualTrade, getVirtualPortfolio } from "@/lib/simulator/engine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export default async function SimulatorPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) return <div>Access Denied</div>;

    // Fetch Data
    const user = await db.user.findUnique({ where: { id: session.user.id } });

    // Handlers (Server Actions style for simplicity in this file for MVP)
    async function tradeAction(formData: FormData) {
        "use server";
        const symbol = formData.get("symbol") as string;
        const quantity = parseInt(formData.get("quantity") as string);
        const type = formData.get("type") as "BUY" | "SELL";
        const userId = session?.user?.id;

        if (!userId) return;

        try {
            await executeVirtualTrade(userId, symbol, quantity, type);
            revalidatePath("/dashboard/simulator");
        } catch (e: any) {
            console.error("Trade failed", e.message);
            // In a real app, use useFormState to show error
        }
    }

    // Fetch Portfolio (Mock or Real)
    let portfolio: any[] = [];
    try {
        portfolio = await getVirtualPortfolio(session.user.id);
    } catch (e) { console.log(e); }

    const balance = user?.virtualBalance || 100000;
    const portfolioValue = portfolio.reduce((acc, p) => acc + (p.currentValue || 0), 0);
    const totalEquity = balance + portfolioValue;
    const initialEquity = 100000; // Assuming start
    const totalPnl = totalEquity - initialEquity;

    const pnlColor = totalPnl >= 0 ? "text-green-500" : "text-red-500";
    const pnlPercent = (totalPnl / initialEquity) * 100;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Paper Trading Simulator</h2>
            </div>

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
                        {pnlPercent.toFixed(2)}% All Time
                    </div>
                </div>
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
                                {portfolio.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.symbol}</TableCell>
                                        <TableCell>{p.quantity}</TableCell>
                                        <TableCell>₹{p.avgBuyPrice.toFixed(2)}</TableCell>
                                        <TableCell>₹{p.currentPrice?.toFixed(2)}</TableCell>
                                        <TableCell className={p.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                            {p.pnl >= 0 ? "+" : ""}₹{p.pnl.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {portfolio.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No holdings</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Place Order</CardTitle>
                        <CardDescription>Execute a virtual trade.</CardDescription>
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
                                        <Label htmlFor="symbol">Symbol</Label>
                                        <Input id="symbol" name="symbol" placeholder="e.g. RELIANCE" required className="uppercase" />
                                    </div>
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="quantity">Quantity</Label>
                                        <Input id="quantity" name="quantity" type="number" min="1" placeholder="1" required />
                                    </div>
                                    <Button className="w-full bg-green-600 hover:bg-green-700">Buy Stocks</Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="sell">
                                <form action={tradeAction} className="space-y-4 pt-4">
                                    <input type="hidden" name="type" value="SELL" />
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="symbol-sell">Symbol</Label>
                                        <Input id="symbol-sell" name="symbol" placeholder="e.g. RELIANCE" required className="uppercase" />
                                    </div>
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="quantity-sell">Quantity</Label>
                                        <Input id="quantity-sell" name="quantity" type="number" min="1" placeholder="1" required />
                                    </div>
                                    <Button variant="destructive" className="w-full">Sell Stocks</Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
