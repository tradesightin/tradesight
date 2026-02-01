import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { initiateZerodhaLogin } from "@/lib/zerodha";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const loginUrl = initiateZerodhaLogin(session.user.id);
        return NextResponse.json({ url: loginUrl });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
