import Link from "next/link";
import { UserNav } from "@/components/dashboard/user-nav";
import { MainNav } from "@/components/dashboard/main-nav";


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <div className="border-b">
                <div className="flex h-16 items-center px-4">
                    <Link href="/" className="font-bold text-xl mr-6">Review & Rule</Link>
                    <MainNav className="mx-6" />
                    <div className="ml-auto flex items-center space-x-4">
                        <UserNav />
                    </div>
                </div>
            </div>
            <div className="flex-1 space-y-4 p-8 pt-6">
                {children}
            </div>
        </div>
    );
}
