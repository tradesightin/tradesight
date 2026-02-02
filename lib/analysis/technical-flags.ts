import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });
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

        const result = await yahooFinance.chart(querySymbol, {
            period1: startDate,
            period2: endDate,
            interval: "1d",
        });

        const quotes = result?.quotes;
        if (!quotes || quotes.length < 50) {
            throw new Error("Insufficient data");
        }

        // Prepare inputs - filter out null values
        const closes = quotes.map((r: any) => r.close).filter((v: any) => v != null);
        const volumes = quotes.map((r: any) => r.volume).filter((v: any) => v != null);
        const highs = quotes.map((r: any) => r.high).filter((v: any) => v != null);
        const lows = quotes.map((r: any) => r.low).filter((v: any) => v != null);
        const currentPrice = closes[closes.length - 1];

        // --- INDICATORS ---
        const ma50 = closes.length >= 50 ? SMA.calculate({ period: 50, values: closes }) : [];
        const ma200 = closes.length >= 200 ? SMA.calculate({ period: 200, values: closes }) : [];
        const rsi14 = closes.length >= 15 ? RSI.calculate({ period: 14, values: closes }) : [];
        const volSma10 = volumes.length >= 10 ? SMA.calculate({ period: 10, values: volumes }) : [];
        const volSma20 = volumes.length >= 20 ? SMA.calculate({ period: 20, values: volumes }) : [];

        const currentMA50 = ma50.length > 0 ? ma50[ma50.length - 1] : null;
        const currentMA200 = ma200.length > 0 ? ma200[ma200.length - 1] : null;
        const currentRSI = rsi14.length > 0 ? rsi14[rsi14.length - 1] : null;
        const currentVol10 = volSma10.length > 0 ? volSma10[volSma10.length - 1] : null;
        const currentVol20 = volSma20.length > 0 ? volSma20[volSma20.length - 1] : null;

        // --- GREEN FLAGS ---

        // 1. 52-Week High Proximity
        const last250Highs = highs.slice(-250);
        const fiftyTwoWeekHigh = Math.max(...last250Highs);
        const distFromHigh = ((fiftyTwoWeekHigh - currentPrice) / fiftyTwoWeekHigh) * 100;

        if (distFromHigh <= 20) {
            greenFlags.push("Near 52-Week High (<20%)");
        }

        // 2. Volume Surge
        if (currentVol10 != null && currentVol20 != null && currentVol10 >= 1.3 * currentVol20) {
            greenFlags.push("Volume Surge (Avg Vol increasing)");
        }

        // 3. Stage 2 Confirmation
        const prevMA200 = ma200.length >= 20 ? ma200[ma200.length - 20] : null;
        if (currentMA200 != null && prevMA200 != null && currentPrice > currentMA200 && currentMA200 > prevMA200) {
            greenFlags.push("Stage 2 Confirmed (Price > Rising 200MA)");
        }

        // 4. Rising MAs (Golden Cross territory)
        if (currentMA50 != null && currentMA200 != null && currentMA50 > currentMA200) {
            greenFlags.push("Bullish Trend (50MA > 200MA)");
        }

        // 5. RSI Bullish but not overbought
        if (currentRSI != null && currentRSI > 50 && currentRSI <= 70) {
            greenFlags.push("Strong Momentum (RSI 50-70)");
        }

        // --- RED FLAGS ---

        // 1. Death Cross
        if (currentMA50 != null && currentMA200 != null && currentMA50 < currentMA200) {
            redFlags.push("Bearish Trend (50MA < 200MA)");
        }

        // 2. RSI Overbought
        if (currentRSI != null && currentRSI > 75) {
            redFlags.push("Overbought (RSI > 75)");
        }

        // 3. Below Long Term MA
        if (currentMA200 != null && currentPrice < currentMA200) {
            redFlags.push("Below 200 DMA");
        }

        // 4. Declining Volume in Uptrend (Divergence)
        if (closes.length >= 20 && currentVol20 != null && volSma20.length >= 5) {
            const price20DaysAgo = closes[closes.length - 20];
            const volSMASlope = (currentVol20 - volSma20[volSma20.length - 5]) / volSma20[volSma20.length - 5];
            if (currentPrice > price20DaysAgo && volSMASlope < -0.05) {
                redFlags.push("Price Rising on Low Volume (Weakness)");
            }
        }

        // 5. Stage 4
        if (currentMA200 != null && prevMA200 != null && currentPrice < currentMA200 && currentMA200 < prevMA200) {
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
