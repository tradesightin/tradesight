import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleZerodhaCallback, encryptToken } from "@/lib/zerodha";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const requestToken = searchParams.get("request_token");
    const status = searchParams.get("status");

    // Get userId from session instead of state param (Zerodha doesn't always pass state back)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || searchParams.get("state");

    console.log("Zerodha callback received:", {
        status,
        requestToken: requestToken ? "present" : "missing",
        userId: userId ? "present" : "missing",
        fromSession: !!session?.user?.id,
        fromState: !!searchParams.get("state"),
    });

    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;

    if (status !== "success" || !requestToken) {
        console.error("Zerodha callback failed: status or token missing");
        return NextResponse.redirect(
            new URL(`/dashboard?error=zerodha_failed&reason=${status || "unknown"}`, baseUrl)
        );
    }

    if (!userId) {
        console.error("Zerodha callback failed: no user session found");
        return NextResponse.redirect(
            new URL("/dashboard?error=zerodha_failed&reason=no_session", baseUrl)
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
