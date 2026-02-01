"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Zap } from "lucide-react";
import { useState } from "react";

export function ZerodhaConnect() {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/zerodha/connect");
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Failed to initiate connection", error);
            setLoading(false);
        }
    };

    return (
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Zap className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-xl">Connect your Zerodha Account</CardTitle>
                <CardDescription className="max-w-md mx-auto mt-2">
                    To see your trade analysis and behavioral patterns, we need to sync your trade history from Kite.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
                <Button size="lg" onClick={handleConnect} disabled={loading} className="gap-2">
                    {loading ? "Connecting..." : "Connect with Kite"}
                    <ExternalLink className="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
}
