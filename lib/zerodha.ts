import crypto from "crypto";

const KITE_CONNECT_API = "https://api.kite.trade";

// Helper to encrypt tokens before storing in DB
export function encryptToken(token: string): string {
    const secret = process.env.NEXTAUTH_SECRET || "default_secret_key_change_me";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", crypto.scryptSync(secret, "salt", 32), iv);
    let encrypted = cipher.update(token);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// Helper to decrypt tokens
export function decryptToken(text: string): string {
    if (!text) return "";
    const secret = process.env.NEXTAUTH_SECRET || "default_secret_key_change_me";
    const textParts = text.split(":");
    if (textParts.length < 2) return "";

    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", crypto.scryptSync(secret, "salt", 32), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export function initiateZerodhaLogin(userId: string) {
    const apiKey = process.env.ZERODHA_API_KEY;
    if (!apiKey) throw new Error("ZERODHA_API_KEY not configured");

    // State is used to verify the response and pass userId
    const state = userId;
    return `https://kite.trade/connect/login?api_key=${apiKey}&v=3&state=${state}`;
}

export async function handleZerodhaCallback(requestToken: string) {
    const apiKey = process.env.ZERODHA_API_KEY;
    const apiSecret = process.env.ZERODHA_API_SECRET;

    if (!apiKey || !apiSecret) throw new Error("Zerodha credentials missing");

    // Exchange request token for access token
    const checksum = crypto
        .createHash("sha256")
        .update(apiKey + requestToken + apiSecret)
        .digest("hex");

    const response = await fetch(`${KITE_CONNECT_API}/session/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            api_key: apiKey,
            request_token: requestToken,
            checksum: checksum,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Zerodha Token Exchange Failed: ${error}`);
    }

    const data = await response.json();
    return {
        accessToken: data.data.access_token,
        zerodhaUserId: data.data.user_id,
        userProfile: data.data,
    };
}

export async function fetchTradeHistory(accessToken: string, fromDate: string, toDate: string) {
    const decryptedToken = decryptToken(accessToken);

    const response = await fetch(`${KITE_CONNECT_API}/orders`, {
        headers: {
            "X-Kite-Version": "3",
            "Authorization": `token ${process.env.ZERODHA_API_KEY}:${decryptedToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch orders");
    }

    const data = await response.json();

    // Filter for filled orders and process them into trades
    // This is a simplified version - in reality we need to match buy/sell pairs
    return data.data.filter((order: any) => order.status === "COMPLETE");
}

export async function fetchHoldings(accessToken: string) {
    const decryptedToken = decryptToken(accessToken);

    const response = await fetch(`${KITE_CONNECT_API}/portfolio/holdings`, {
        headers: {
            "X-Kite-Version": "3",
            "Authorization": `token ${process.env.ZERODHA_API_KEY}:${decryptedToken}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch holdings");
    }

    const data = await response.json();
    return data.data;
}
