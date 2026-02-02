import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, Trash2, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { StatCard } from "@/components/dashboard/stat-card";

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = session.user.id;

    // Fetch real data from DB
    const alerts = await db.alert.findMany({
        where: { userId },
        orderBy: { triggeredAt: 'desc' },
        take: 20,
    });

    const rules = await db.alertRule.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });

    const unreadCount = alerts.filter((a: any) => !a.isRead).length;
    const highPriorityCount = alerts.filter((a: any) => a.priority === "HIGH" && !a.isRead).length;

    // Server action: Create alert rule
    async function createRule(formData: FormData) {
        "use server";
        const sess = await getServerSession(authOptions);
        if (!sess?.user?.id) return;

        const ruleName = formData.get("ruleName") as string;
        const symbol = (formData.get("symbol") as string).toUpperCase();
        const indicator = formData.get("indicator") as string;
        const condition = formData.get("condition") as string;
        const value = parseFloat(formData.get("value") as string);

        if (!ruleName || !symbol || !indicator || !condition || isNaN(value)) return;

        await db.alertRule.create({
            data: {
                userId: sess.user.id,
                ruleName,
                ruleType: `${indicator}_${condition}`,
                parameters: { symbol, indicator, condition, value },
            },
        });

        revalidatePath("/dashboard/alerts");
    }

    // Server action: Delete alert rule
    async function deleteRule(formData: FormData) {
        "use server";
        const sess = await getServerSession(authOptions);
        if (!sess?.user?.id) return;

        const ruleId = formData.get("ruleId") as string;
        if (!ruleId) return;

        await db.alertRule.delete({
            where: { id: ruleId, userId: sess.user.id },
        });

        revalidatePath("/dashboard/alerts");
    }

    // Server action: Mark alert as read
    async function markRead(formData: FormData) {
        "use server";
        const sess = await getServerSession(authOptions);
        if (!sess?.user?.id) return;

        const alertId = formData.get("alertId") as string;
        if (!alertId) return;

        await db.alert.update({
            where: { id: alertId, userId: sess.user.id },
            data: { isRead: true },
        });

        revalidatePath("/dashboard/alerts");
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Active Rules"
                    value={rules.filter((r: any) => r.isActive).length}
                    description="Monitoring your portfolio"
                    trend="neutral"
                />
                <StatCard
                    title="Unread Alerts"
                    value={unreadCount}
                    description="Need your attention"
                    trend={unreadCount > 0 ? "up" : "neutral"}
                    alert={highPriorityCount > 0}
                />
                <StatCard
                    title="High Priority"
                    value={highPriorityCount}
                    description="Critical signals"
                    trend={highPriorityCount > 0 ? "down" : "neutral"}
                    alert={highPriorityCount > 0}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Notifications</CardTitle>
                        <CardDescription>History of triggered alerts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <p className="text-sm text-muted-foreground">No alerts yet. Create a rule to start monitoring.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alerts.map((alert: any) => (
                                    <div key={alert.id} className={`flex items-start space-x-4 rounded-md border p-4 ${!alert.isRead ? 'bg-primary/5 border-primary/20' : ''}`}>
                                        <AlertTriangle className={`mt-1 h-5 w-5 flex-shrink-0 ${
                                            alert.priority === "HIGH" ? "text-red-500" :
                                            alert.priority === "MEDIUM" ? "text-amber-500" :
                                            "text-blue-500"
                                        }`} />
                                        <div className="flex-1 space-y-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium leading-none">{alert.symbol}</p>
                                                <Badge variant={
                                                    alert.priority === "HIGH" ? "destructive" :
                                                    alert.priority === "MEDIUM" ? "secondary" : "outline"
                                                } className="text-[10px]">
                                                    {alert.priority}
                                                </Badge>
                                                {!alert.isRead && (
                                                    <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {alert.message}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <p className="text-xs text-muted-foreground">
                                                    {alert.triggeredAt.toLocaleDateString()} {alert.triggeredAt.toLocaleTimeString()}
                                                </p>
                                                {!alert.isRead && (
                                                    <form action={markRead}>
                                                        <input type="hidden" name="alertId" value={alert.id} />
                                                        <button type="submit" className="text-xs text-primary hover:underline">
                                                            Mark read
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="col-span-3 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Create Alert Rule
                            </CardTitle>
                            <CardDescription>Set up a new monitoring rule.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={createRule} className="space-y-4">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="ruleName">Rule Name</Label>
                                    <Input id="ruleName" name="ruleName" placeholder="e.g. RELIANCE RSI Alert" required />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="symbol">Symbol</Label>
                                    <Input id="symbol" name="symbol" placeholder="e.g. RELIANCE" required className="uppercase" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="indicator">Indicator</Label>
                                        <select
                                            id="indicator"
                                            name="indicator"
                                            required
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="PRICE">Price</option>
                                            <option value="RSI">RSI (14)</option>
                                        </select>
                                    </div>
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="condition">Condition</Label>
                                        <select
                                            id="condition"
                                            name="condition"
                                            required
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="GT">Greater than</option>
                                            <option value="LT">Less than</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="value">Value</Label>
                                    <Input id="value" name="value" type="number" step="0.01" placeholder="e.g. 2500 or 70" required />
                                </div>
                                <Button type="submit" className="w-full">
                                    <Bell className="mr-2 h-4 w-4" /> Create Rule
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active Rules</CardTitle>
                            <CardDescription>Your configured monitoring rules.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {rules.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No rules created yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {rules.map((rule: any) => {
                                        const params = rule.parameters as Record<string, any>;
                                        return (
                                            <div key={rule.id} className="flex items-center justify-between rounded-md border p-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{rule.ruleName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {params?.symbol} - {params?.indicator} {params?.condition === "GT" ? ">" : "<"} {params?.value}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Badge variant="outline" className={rule.isActive ? "bg-green-50 text-green-700 border-green-200" : ""}>
                                                        {rule.isActive ? "Active" : "Paused"}
                                                    </Badge>
                                                    <form action={deleteRule}>
                                                        <input type="hidden" name="ruleId" value={rule.id} />
                                                        <button type="submit" className="text-red-500 hover:text-red-700 p-1">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
