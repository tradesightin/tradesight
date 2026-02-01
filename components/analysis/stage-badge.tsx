import { Badge } from "@/components/ui/badge";

interface StageBadgeProps {
    stage: 1 | 2 | 3 | 4;
}

export function StageBadge({ stage }: StageBadgeProps) {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let colorClass = "";
    let label = "";

    switch (stage) {
        case 1:
            variant = "secondary"; // Gray/Slate
            label = "Stage 1 (Basing)";
            colorClass = "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
            break;
        case 2:
            variant = "default"; // Primary/Green ish check below
            label = "Stage 2 (Advancing)";
            colorClass = "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
            break;
        case 3:
            variant = "secondary"; // Orange?
            label = "Stage 3 (Topping)";
            colorClass = "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
            break;
        case 4:
            variant = "destructive"; // Red
            label = "Stage 4 (Declining)";
            break;
    }

    return (
        <Badge variant={variant} className={`${colorClass} whitespace-nowrap`}>
            {label}
        </Badge>
    );
}
