import Link from "next/link";
import { UserNav } from "@/components/dashboard/user-nav";
import { MainNav } from "@/components/dashboard/main-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { BarChart2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <div className="border-b">
                <div className="flex h-16 items-center px-4 md:px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary mr-6">
                        <BarChart2 className="h-5 w-5" />
                        <span className="hidden sm:inline">Review & Rule</span>
                        <span className="sm:hidden">R&R</span>
                    </Link>
                    <MainNav className="mx-6 hidden md:flex" />
                    <div className="ml-auto flex items-center space-x-4">
                        <UserNav />
                    </div>
                </div>
            </div>
            <div className="flex-1 space-y-4 p-4 pt-4 md:p-8 md:pt-6 pb-20 md:pb-8">
                {children}
            </div>
            <footer className="border-t py-4 px-4 md:px-8 hidden md:block">
                <p className="text-xs text-muted-foreground text-center">
                    Review & Rule is an analytics tool, not an investment advisor.
                    We do not provide investment advice or recommendations.
                    All trading and investment decisions are your sole responsibility.
                    Past performance does not guarantee future results.
                </p>
            </footer>
            <MobileNav />
        </div>
    );
}
