"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function ImportTrades() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [fileName, setFileName] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setStatus("idle");
            setMessage("");
        }
    };

    const handleUpload = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus("idle");
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/trades/import", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Import failed");
            }

            setStatus("success");
            setMessage(`Imported ${data.count} trades (${data.skipped} skipped, ${data.total} total rows)`);
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
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Trade History
                </CardTitle>
                <CardDescription>
                    Upload your Zerodha Console tradebook CSV to import historical trades.
                    Go to{" "}
                    <a
                        href="https://console.zerodha.com/reports/tradebook"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                    >
                        console.zerodha.com → Reports → Tradebook
                    </a>
                    , select a date range, and download as CSV.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="tradebook-csv"
                    />
                    <Button
                        variant="outline"
                        onClick={() => fileRef.current?.click()}
                        className="gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        {fileName || "Choose CSV file"}
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={loading || !fileName}
                        className="gap-2"
                    >
                        <Upload className={`h-4 w-4 ${loading ? "animate-bounce" : ""}`} />
                        {loading ? "Importing..." : "Import Trades"}
                    </Button>
                </div>

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

                <p className="text-xs text-muted-foreground">
                    Only equity (NSE/BSE) trades are imported. BUY and SELL orders are matched using FIFO.
                    Duplicates are automatically skipped.
                </p>
            </CardContent>
        </Card>
    );
}
