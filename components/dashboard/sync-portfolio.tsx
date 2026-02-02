"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncPortfolio() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleSync = async () => {
        setLoading(true);
        setStatus("idle");
        setMessage("");

        try {
            const res = await fetch("/api/portfolio/sync", { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Sync failed");
            }

            setStatus("success");
            setMessage(`Synced ${data.count} holdings successfully!`);

            // Refresh the page to show data
            setTimeout(() => router.refresh(), 1500);
        } catch (error: any) {
            setStatus("error");
            setMessage(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Sync Your Portfolio</CardTitle>
                <CardDescription>
                    Your Zerodha account is connected. Click the button below to pull your current holdings.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pb-8">
                <Button size="lg" onClick={handleSync} disabled={loading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Syncing..." : "Sync Portfolio Now"}
                </Button>

                {status === "success" && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        {message}
                    </div>
                )}

                {status === "error" && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {message}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
