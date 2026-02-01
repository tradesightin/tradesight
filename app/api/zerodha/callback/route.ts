import { NextRequest, NextResponse } from "next/server";
import { handleZerodhaCallback, encryptToken } from "@/lib/zerodha";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const requestToken = searchParams.get("request_token");
    const status = searchParams.get("status");
    const userId = searchParams.get("state"); // We passed userId as state

    if (status !== "success" || !requestToken || !userId) {
        return NextResponse.redirect(new URL("/dashboard?error=zerodha_failed", req.url));
    }

    try {
        // Exchange token
        const { accessToken, zerodhaUserId } = await handleZerodhaCallback(requestToken);

        // Encrypt and store
        const encryptedToken = encryptToken(accessToken);

        await db.user.update({
            where: { id: userId },
            data: {
                zerodhaUserId: zerodhaUserId,
                zerodhaAccessToken: encryptedToken,
            },
        });

        return NextResponse.redirect(new URL("/dashboard?success=zerodha_connected", req.url));
    } catch (error) {
        console.error("Zerodha callback error:", error);
        return NextResponse.redirect(new URL("/dashboard?error=zerodha_exchange_failed", req.url));
    }
}
