import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
import { SMA } from "technicalindicators";

export interface StageResult {
    symbol: string;
    stage: 1 | 2 | 3 | 4;
    ma200: number;
    currentPrice: number;
    maSlope: "RISING" | "FALLING" | "FLAT";
    insight: string;
}

export async function calculateStage(symbol: string): Promise<StageResult> {
    // Append .NS for NSE stocks if not present
    const querySymbol = symbol.endsWith(".NS") || symbol.endsWith(".BO") ? symbol : `${symbol}.NS`;

    try {
        // 1. Fetch 1 year of daily data (approx 250 trading days) + buffer for MA calculation
        // We need 200 data points just for the first MA value, so let's fetch 300 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 400); // 400 days ago to be safe

        const result = await yahooFinance.historical(querySymbol, {
            period1: startDate,
            period2: endDate,
            interval: "1d",
        });

        if (!result || (result as any[]).length < 205) {
            throw new Error("Insufficient data for stage analysis (need > 200 days)");
        }

        const closes = (result as any[]).map((r: any) => r.close);

        // 2. Calculate 200-day Moving Average
        // technicalindicators SMA input req: period, values
        const ma200Values = SMA.calculate({ period: 200, values: closes });

        if (ma200Values.length < 5) {
            throw new Error("Not enough MA data calculated");
        }

        const currentPrice = closes[closes.length - 1];
        const currentMA = ma200Values[ma200Values.length - 1];
        const prevMA = ma200Values[ma200Values.length - 5]; // Check slope over last 5 days

        // 3. Determine MA Slope
        let maSlope: "RISING" | "FALLING" | "FLAT" = "FLAT";
        const slopeThreshold = 0.001; // 0.1% change
        const percentChange = (currentMA - prevMA) / prevMA;

        if (percentChange > slopeThreshold) maSlope = "RISING";
        else if (percentChange < -slopeThreshold) maSlope = "FALLING";

        // 4. Determine Stage (Simplified Logic)
        let stage: 1 | 2 | 3 | 4 = 1;

        if (currentPrice > currentMA) {
            if (maSlope === "RISING") {
                stage = 2; // Stage 2: Above rising MA
            } else if (maSlope === "FLAT") {
                stage = 1; // Stage 1 (or early 3): Above flat MA. Usually Stage 1 is Basing.
                // Refinement: If it was previously falling, it's Stage 1. If rising, maybe early Stage 3.
                // For simplicity: Base on price level relative to recent highs/lows could be added.
                // Defaulting to 1 for "Recovery/Basing" if flat-ish.
            } else {
                stage = 3; // Stage 3: Price might be above/around MA but MA is rolling over/falling? 
                // Actually Stage 3 is usually consolidating sideways.
                // If price > MA but MA falling, it's weak.
                // Let's stick to standard definitions:
                // Stage 1: MA Flat/Sideways, Price oscillates around MA.
                // Stage 2: MA Rising, Price > MA
                // Stage 3: MA Flat/Sideways, Price oscillates (often erratic), forming top.
                // Stage 4: MA Falling, Price < MA
            }
        } else {
            // Price < MA
            if (maSlope === "FALLING") {
                stage = 4; // Stage 4: Below falling MA
            } else if (maSlope === "RISING") {
                // Price dipped below rising MA - pullback in Stage 2 or start of Stage 3/4
                stage = 3; // Treat as warning/topping
            } else {
                stage = 1; // Below flat MA - Basing/Chop
            }
        }

        // Refined Logic based on Weinstein STRICTER rules:
        // Stage 2: Price > MA200 AND MA200 is Rising
        if (currentPrice > currentMA && maSlope === "RISING") stage = 2;
        // Stage 4: Price < MA200 AND MA200 is Falling
        else if (currentPrice < currentMA && maSlope === "FALLING") stage = 4;
        // Stage 1: Price ~ MA200 (within 5%?) AND MA200 Flat
        else if (maSlope === "FLAT") stage = 1;
        // Stage 3: Remaining cases (often topping/choppy)
        else stage = 3;


        let insight = "";
        switch (stage) {
            case 1: insight = "Basing Phase. Price consolidating near moving average."; break;
            case 2: insight = "Advancing Phase. Price above rising 200-day MA."; break;
            case 3: insight = "Topping Phase. Increased volatility detected. Review your rules."; break;
            case 4: insight = "Declining Phase. Price below falling 200-day MA. Review your position."; break;
        }

        return {
            symbol,
            stage,
            ma200: currentMA,
            currentPrice,
            maSlope,
            insight,
        };

    } catch (error: any) {
        console.error(`Stage analysis failed for ${symbol}:`, error);
        // Return safe default
        return {
            symbol,
            stage: 1,
            ma200: 0,
            currentPrice: 0,
            maSlope: "FLAT",
            insight: "Insufficient data or error."
        };
    }
}
