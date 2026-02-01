import yahooFinance from "yahoo-finance2";
import { SMA, RSI, MACD } from "technicalindicators";
import { calculateStage } from "./stage";

export interface FlagResult {
    symbol: string;
    greenFlags: string[];
    redFlags: string[];
    greenCount: number;
    redCount: number;
    summary: string;
}

export async function calculateAllFlags(symbol: string): Promise<FlagResult> {
    const querySymbol = symbol.endsWith(".NS") || symbol.endsWith(".BO") ? symbol : `${symbol}.NS`;
    const greenFlags: string[] = [];
    const redFlags: string[] = [];

    try {
        // Fetch Data (1 year + buffer)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 400);

        const result = await yahooFinance.historical(querySymbol, {
            period1: startDate,
            period2: endDate,
            interval: "1d",
        });

        if (!result || (result as any[]).length < 250) {
            throw new Error("Insufficient data");
        }

        // Prepare inputs
        const closes = (result as any[]).map((r: any) => r.close);
        const volumes = (result as any[]).map((r: any) => r.volume);
        const highs = (result as any[]).map((r: any) => r.high);
        const lows = (result as any[]).map((r: any) => r.low);
        const currentPrice = closes[closes.length - 1];

        // --- INDICATORS ---
        const ma50 = SMA.calculate({ period: 50, values: closes });
        const ma200 = SMA.calculate({ period: 200, values: closes });
        const rsi14 = RSI.calculate({ period: 14, values: closes });
        const volSma10 = SMA.calculate({ period: 10, values: volumes });
        const volSma20 = SMA.calculate({ period: 20, values: volumes });

        const currentMA50 = ma50[ma50.length - 1];
        const currentMA200 = ma200[ma200.length - 1];
        const currentRSI = rsi14[rsi14.length - 1];
        const currentVol10 = volSma10[volSma10.length - 1];
        const currentVol20 = volSma20[volSma20.length - 1];

        // --- GREEN FLAGS ---

        // 1. 52-Week High Proximity
        // Calculate 52-week high from last 250 days
        const last250Highs = highs.slice(-250);
        const fiftyTwoWeekHigh = Math.max(...last250Highs);
        const distFromHigh = ((fiftyTwoWeekHigh - currentPrice) / fiftyTwoWeekHigh) * 100;

        if (distFromHigh <= 20) {
            greenFlags.push("Near 52-Week High (<20%)");
        }

        // 2. Volume Surge
        if (currentVol10 >= 1.3 * currentVol20) {
            greenFlags.push("Volume Surge (Avg Vol increasing)");
        }

        // 3. Stage 2 Confirmation
        // We reuse logic or call function. Calling function might double-fetch, so let's simplify logic here or assume efficient caching in future.
        // Re-implementing simplified Stage 2 check to avoid extra API call if possible, or just check MA slope here.
        const prevMA200 = ma200[ma200.length - 20]; // 20 days ago
        if (currentPrice > currentMA200 && currentMA200 > prevMA200) {
            greenFlags.push("Stage 2 Confirmed (Price > Rising 200MA)");
        }

        // 4. Rising MAs (Golden Cross territory)
        if (currentMA50 > currentMA200) {
            greenFlags.push("Bullish Trend (50MA > 200MA)");
        }

        // 5. RSI Bullish but not overbought (e.g., 50-70 range is strong momentum)
        if (currentRSI > 50 && currentRSI <= 70) {
            greenFlags.push("Strong Momentum (RSI 50-70)");
        }

        // --- RED FLAGS ---

        // 1. Death Cross Check (Recent Crossover)
        // Check if 50MA crossed below 200MA in last 10 days
        // Simplified: Just check current state + distance? Correct definition is strictly the cross.
        // Let's flag if 50 < 200 as general Bearish, but specifically "Death Cross" if it just happened.
        if (currentMA50 < currentMA200) {
            redFlags.push("Bearish Trend (50MA < 200MA)");
        }

        // 2. RSI Overbought
        if (currentRSI > 75) {
            redFlags.push("Overbought (RSI > 75)");
        }

        // 3. RSI Oversold (Wait, is this a red flag? Depending on strategy. usually Oversold is buy signal, but can mean crash)
        // We'll stick to user requirements. "Below Long Term MA"
        if (currentPrice < currentMA200) {
            redFlags.push("Below 200 DMA");
        }

        // 4. Declining Volume in Uptrend (Divergence)
        // If Price is rising (last 20 days) but Volume SMA is falling
        const price20DaysAgo = closes[closes.length - 20];
        const volSMASlope = (currentVol20 - volSma20[volSma20.length - 5]) / volSma20[volSma20.length - 5];
        if (currentPrice > price20DaysAgo && volSMASlope < -0.05) {
            redFlags.push("Price Rising on Low Volume (Weakness)");
        }

        // 5. Stage 4
        if (currentPrice < currentMA200 && currentMA200 < prevMA200) {
            redFlags.push("Stage 4 Confirmed (Price < Falling 200MA)");
        }

    } catch (error) {
        console.error("Flag calculation error", error);
        // Continue with empty flags or error note
        redFlags.push("Data Error - Could not calculate");
    }

    // Summary logic
    let summary = "Neutral";
    if (greenFlags.length > redFlags.length + 1) summary = "Bullish";
    else if (redFlags.length > greenFlags.length + 1) summary = "Bearish";
    else if (greenFlags.length > 0 && redFlags.length > 0) summary = "Mixed";

    return {
        symbol,
        greenFlags,
        redFlags,
        greenCount: greenFlags.length,
        redCount: redFlags.length,
        summary,
    };
}
