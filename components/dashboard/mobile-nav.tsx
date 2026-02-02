"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Briefcase, Bell, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/dashboard/analysis", label: "Analysis", icon: BarChart2 },
    { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase },
    { href: "/dashboard/simulator", label: "Simulator", icon: FlaskConical },
    { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] rounded-lg transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
