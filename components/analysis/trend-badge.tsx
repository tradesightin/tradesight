import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrendBadgeProps {
    trend: "RISING" | "FALLING" | "FLAT";
}

export function TrendBadge({ trend }: TrendBadgeProps) {
    if (trend === "RISING") {
        return (
            <Badge variant="outline" className="gap-1 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                <ArrowUpRight className="h-3 w-3" /> Rising
            </Badge>
        );
    }
    if (trend === "FALLING") {
        return (
            <Badge variant="outline" className="gap-1 border-red-200 text-red-700 dark:border-red-800 dark:text-red-400">
                <ArrowDownRight className="h-3 w-3" /> Falling
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="gap-1 border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-400">
            <Minus className="h-3 w-3" /> Flat
        </Badge>
    );
}
