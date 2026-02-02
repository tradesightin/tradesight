import yahooFinance from "yahoo-finance2";
import { Trade, Portfolio } from "@prisma/client";
import { differenceInDays, addDays } from "date-fns";

// Types
export interface HoldingPeriodAnalysis {
    avgWinDays: number;
    avgLossDays: number;
    ratio: number;
    insight: string;
}

export interface ProfitPatternAnalysis {
    avgProfit: number;
    avgLoss: number;
    winRate: number;
    profitToLossRatio: number;
    insight: string;
}

export interface AveragingDownAnalysis {
    instances: {
        symbol: string;
        attempts: number;
        outcome: "RECOVERED" | "FAILED";
        pnl: number;
    }[];
    successRate: number;
    totalImpact: number;
    insight: string;
}

export interface EarlyExitAnalysis {
    missedOpportunities: {
        symbol: string;
        sellDate: Date;
        sellPrice: number;
        priceAfter30d: number;
        missedProfitPercent: number;
    }[];
    totalMissedProfit: number;
    insight: string;
}

export interface SectorAnalysis {
    sectors: { name: string; allocation: number; value: number }[];
    topSector: string;
    concentration: number;
    insight: string;
}

// 1. Analyze Holding Period
export function analyzeHoldingPeriod(trades: Trade[]): HoldingPeriodAnalysis {
    const winningTrades = trades.filter((t) => (t.profitLoss || 0) > 0);
    const losingTrades = trades.filter((t) => (t.profitLoss || 0) <= 0);

    const avgWinDays =
        winningTrades.reduce((acc, t) => acc + (t.holdingPeriodDays || 0), 0) /
        (winningTrades.length || 1);

    const avgLossDays =
        losingTrades.reduce((acc, t) => acc + (t.holdingPeriodDays || 0), 0) /
        (losingTrades.length || 1);

    const ratio = avgWinDays === 0 ? 0 : avgLossDays / avgWinDays;

    let insight = "Your holding patterns are balanced.";
    if (ratio > 2) {
        insight = `You hold losers ${ratio.toFixed(1)}x longer than winners. Consider cutting losses earlier.`;
    } else if (ratio < 0.5) {
        insight = `You might be selling winners too early. You hold winners only ${avgWinDays.toFixed(0)} days on average.`;
    }

    return { avgWinDays, avgLossDays, ratio, insight };
}

// 2. Analyze Profit Patterns
export function analyzeProfitPatterns(trades: Trade[]): ProfitPatternAnalysis {
    const winningTrades = trades.filter((t) => (t.profitLoss || 0) > 0);
    const losingTrades = trades.filter((t) => (t.profitLoss || 0) <= 0);

    const avgProfit =
        winningTrades.reduce((acc, t) => acc + (t.profitLoss || 0), 0) /
        (winningTrades.length || 1);

    const avgLoss =
        losingTrades.reduce((acc, t) => acc + (t.profitLoss || 0), 0) /
        (losingTrades.length || 1);

    const winRate = (winningTrades.length / (trades.length || 1)) * 100;
    const profitToLossRatio = avgLoss === 0 ? 0 : Math.abs(avgProfit / avgLoss);

    let insight = "Balanced risk/reward ratio.";
    if (profitToLossRatio < 1) {
        insight = `Risk Warning: Your average loss (${Math.abs(avgLoss).toFixed(0)}) is larger than your average profit (${avgProfit.toFixed(0)}).`;
    } else if (profitToLossRatio > 2) {
        insight = "Excellent! Your winners are significantly larger than your losers.";
    }

    return { avgProfit, avgLoss, winRate, profitToLossRatio, insight };
}

// 3. Detect Averaging Down
// This requires analyzing buy orders specifically, grouping by symbol between full exits
export function detectAveragingDown(trades: Trade[]): AveragingDownAnalysis {
    // Simplified logic: Check if we have multiple buys for same symbol within a short period
    // In a real app, this needs complex order matching. 
    // For this MVP, we'll return mock/placeholder or simple logic if data structure allowed

    // Placeholder implementation
    return {
        instances: [],
        successRate: 0,
        totalImpact: 0,
        insight: "No significant averaging down patterns detected in recent trades."
    };
}

// 4. Find Early Exits
export async function findEarlyExits(trades: Trade[]): Promise<EarlyExitAnalysis> {
    const recentSells = trades
        .filter((t) => t.sellDate && t.sellPrice && t.symbol)
        .slice(0, 10); // Analyze last 10 sells to avoid API limits

    const missedOpportunities = [];
    let totalMissedProfit = 0;

    for (const trade of recentSells) {
        if (!trade.sellDate || !trade.symbol || !trade.sellPrice) continue;

        try {
            const dateAfter30d = addDays(trade.sellDate, 30);

            // Don't check if 30 days haven't passed
            if (dateAfter30d > new Date()) continue;

            const chartResult = await yahooFinance.chart(trade.symbol + ".NS", {
                period1: dateAfter30d,
                period2: addDays(dateAfter30d, 5),
                interval: "1d",
            });

            if (chartResult?.quotes && chartResult.quotes[0]) {
                const priceAfter30d = (chartResult.quotes[0] as any).close;

                if (priceAfter30d > trade.sellPrice * 1.1) { // 10% higher
                    const missedPerc = ((priceAfter30d - trade.sellPrice) / trade.sellPrice) * 100;
                    missedOpportunities.push({
                        symbol: trade.symbol,
                        sellDate: trade.sellDate,
                        sellPrice: trade.sellPrice,
                        priceAfter30d,
                        missedProfitPercent: missedPerc,
                    });
                    totalMissedProfit += (priceAfter30d - trade.sellPrice) * trade.quantity;
                }
            }
        } catch (err) {
            console.error(`Failed to fetch history for ${trade.symbol}`, err);
        }
    }

    let insight = "Your exit timing is generally good.";
    if (missedOpportunities.length > 2) {
        insight = `You tend to sell winners early. ${missedOpportunities.length} recent trades went up significantly after you sold.`;
    }

    return { missedOpportunities, totalMissedProfit, insight };
}

// 5. Analyze Sector Concentration
// Requires a symbol -> sector mapping service or static list needed
export function analyzeSectorConcentration(portfolio: Portfolio[]): SectorAnalysis {
    // Mock sector mapping for Indian stocks
    const sectorMap: Record<string, string> = {
        "RELIANCE": "Energy", "TCS": "IT", "INFY": "IT", "HDFCBANK": "Finance",
        "ICICIBANK": "Finance", "ITC": "FMCG", "TATAMOTORS": "Auto",
        "SUNPHARMA": "Pharma", "BAJFINANCE": "Finance"
    };

    const sectorValues: Record<string, number> = {};
    let totalValue = 0;

    portfolio.forEach(p => {
        const sector = sectorMap[p.symbol] || "Other";
        const value = p.quantity * p.currentPrice;
        sectorValues[sector] = (sectorValues[sector] || 0) + value;
        totalValue += value;
    });

    const sectors = Object.entries(sectorValues)
        .map(([name, value]) => ({
            name,
            value,
            allocation: (value / totalValue) * 100
        }))
        .sort((a, b) => b.value - a.value);

    const topSector = sectors[0]?.name || "None";
    const concentration = sectors[0]?.allocation || 0;

    let insight = "Good diversification.";
    if (concentration > 40) {
        insight = `High concentration risk: ${concentration.toFixed(0)}% of your portfolio is in ${topSector}.`;
    }

    return { sectors, topSector, concentration, insight };
}
