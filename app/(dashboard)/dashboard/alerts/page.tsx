import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, CheckCircle2, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

// Force dynamic
export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    // Fetch Alerts & Rules
    // const alerts = await db.alert.findMany(...)
    // Mock data for MVP display
    const alerts = [
        { id: "1", symbol: "RELIANCE", message: "Rule 'Buy Reliance' Triggered: RSI is 35", priority: "HIGH", triggeredAt: new Date() },
        { id: "2", symbol: "TCS", message: "Rule 'Profit Talk' Triggered: Price is 3600", priority: "MEDIUM", triggeredAt: new Date(Date.now() - 86400000) },
    ];

    const rules = [
        { id: "r1", ruleName: "Buy Reliance", symbol: "RELIANCE", type: "RSI < 40", isActive: true },
        { id: "r2", ruleName: "Profit Book TCS", symbol: "TCS", type: "Price > 3550", isActive: true },
    ];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h2>
                <Button>
                    <Bell className="mr-2 h-4 w-4" /> Create New Alert
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Notifications</CardTitle>
                        <CardDescription>History of triggered alerts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {alerts.map((alert) => (
                                <div key={alert.id} className="flex items-start space-x-4 rounded-md border p-4">
                                    <AlertTriangle className="mt-1 h-5 w-5 text-amber-500" />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {alert.symbol} - {alert.priority}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {alert.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {alert.triggeredAt.toLocaleDateString()} {alert.triggeredAt.toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {alerts.length === 0 && <p className="text-sm text-muted-foreground">No recent alerts.</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Active Rules</CardTitle>
                        <CardDescription>Your configured monitoring rules.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rule</TableHead>
                                    <TableHead>Condition</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rules.map((rule) => (
                                    <TableRow key={rule.id}>
                                        <TableCell className="font-medium">{rule.ruleName}</TableCell>
                                        <TableCell>{rule.type}</TableCell>
                                        <TableCell>
                                            <Badge variant={rule.isActive ? "secondary" : "outline"} className={rule.isActive ? "bg-green-100 text-green-800" : ""}>
                                                {rule.isActive ? "Active" : "Paused"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
