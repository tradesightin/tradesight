import { NextResponse } from "next/server";
import { checkAlerts } from "@/lib/alerts/engine";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const result = await checkAlerts();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to check alerts" }, { status: 500 });
    }
}
