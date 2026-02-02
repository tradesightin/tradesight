import { NextRequest, NextResponse } from "next/server";
import { handleZerodhaCallback, encryptToken } from "@/lib/zerodha";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const requestToken = searchParams.get("request_token");
    const status = searchParams.get("status");
    const userId = searchParams.get("state");

    // Log everything Zerodha sends back for debugging
    console.log("Zerodha callback received:", {
        status,
        requestToken: requestToken ? "present" : "missing",
        userId: userId ? "present" : "missing",
        allParams: Object.fromEntries(searchParams.entries()),
    });

    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;

    if (status !== "success" || !requestToken || !userId) {
        console.error("Zerodha callback failed:", {
            statusReceived: status,
            hasRequestToken: !!requestToken,
            hasUserId: !!userId,
        });
        return NextResponse.redirect(
            new URL(`/dashboard?error=zerodha_failed&reason=${status || "unknown"}`, baseUrl)
        );
    }

    try {
        const { accessToken, zerodhaUserId } = await handleZerodhaCallback(requestToken);
        const encryptedToken = encryptToken(accessToken);

        await db.user.update({
            where: { id: userId },
            data: {
                zerodhaUserId: zerodhaUserId,
                zerodhaAccessToken: encryptedToken,
            },
        });

        console.log("Zerodha connected successfully for user:", userId);
        return NextResponse.redirect(new URL("/dashboard?success=zerodha_connected", baseUrl));
    } catch (error: any) {
        console.error("Zerodha token exchange error:", error?.message || error);
        return NextResponse.redirect(
            new URL(`/dashboard?error=zerodha_exchange_failed&detail=${encodeURIComponent(error?.message || "unknown")}`, baseUrl)
        );
    }
}
