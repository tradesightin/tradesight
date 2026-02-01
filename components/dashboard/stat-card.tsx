import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    alert?: boolean;
}

export function StatCard({ title, value, description, trend, trendValue, alert }: StatCardProps) {
    return (
        <Card className={alert ? "border-red-500 bg-red-50 dark:bg-red-950/10" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {trend === "up" && <ArrowUpIcon className="h-4 w-4 text-green-500" />}
                {trend === "down" && <ArrowDownIcon className="h-4 w-4 text-red-500" />}
                {trend === "neutral" && <MinusIcon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trendValue) && (
                    <p className="text-xs text-muted-foreground">
                        {trendValue && <span className={trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : ""}>{trendValue} </span>}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
