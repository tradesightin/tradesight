import { Trade } from "@prisma/client";
import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

export interface SimulationResult {
    originalPL: number;
    simulatedPL: number;
    difference: number;
    differencePercent: number;
    tradesAffected: number;
    totalTrades: number;
    details: {
        symbol: string;
        originalPL: number;
        simulatedPL: number;
        exitReason: string;
        exitDate?: string;
    }[];
}

// 1. Simulate Stop Loss
export async function simulateStopLoss(
    trades: Trade[],
    stopLossPercent: number
): Promise<SimulationResult> {
    const completedTrades = trades.filter(t => t.sellDate && t.sellPrice && t.buyPrice);
    let originalTotal = 0;
    let simulatedTotal = 0;
    let affected = 0;
    const details: SimulationResult["details"] = [];

    for (const trade of completedTrades) {
        const originalPL = ((trade.sellPrice! - trade.buyPrice) / trade.buyPrice) * 100;
        originalTotal += originalPL;

        const stopPrice = trade.buyPrice * (1 - stopLossPercent / 100);

        // Check if price hit stop loss during holding period
        try {
            const querySymbol = trade.symbol.endsWith(".NS") ? trade.symbol : `${trade.symbol}.NS`;
            const chartResult = await yahooFinance.chart(querySymbol, {
                period1: trade.buyDate,
                period2: trade.sellDate!,
                interval: "1d",
            });

            let hitStop = false;
            let stopPL = originalPL;

            for (const day of (chartResult?.quotes || []) as any[]) {
                if (day.low <= stopPrice) {
                    // Stop loss triggered
                    stopPL = ((stopPrice - trade.buyPrice) / trade.buyPrice) * 100;
                    hitStop = true;
                    affected++;
                    details.push({
                        symbol: trade.symbol,
                        originalPL: originalPL,
                        simulatedPL: stopPL,
                        exitReason: `Stop loss at -${stopLossPercent}%`,
                        exitDate: new Date(day.date).toLocaleDateString(),
                    });
                    break;
                }
            }

            if (!hitStop) {
                details.push({
                    symbol: trade.symbol,
                    originalPL,
                    simulatedPL: originalPL,
                    exitReason: "No change (stop not hit)",
                });
            }

            simulatedTotal += hitStop ? stopPL : originalPL;
        } catch {
            // If data fetch fails, use original
            simulatedTotal += originalPL;
            details.push({
                symbol: trade.symbol,
                originalPL,
                simulatedPL: originalPL,
                exitReason: "Data unavailable",
            });
        }
    }

    const difference = simulatedTotal - originalTotal;
    return {
        originalPL: originalTotal,
        simulatedPL: simulatedTotal,
        difference,
        differencePercent: originalTotal !== 0 ? (difference / Math.abs(originalTotal)) * 100 : 0,
        tradesAffected: affected,
        totalTrades: completedTrades.length,
        details: details.slice(0, 20),
    };
}

// 2. Simulate Trailing Stop
export async function simulateTrailingStop(
    trades: Trade[],
    trailingPercent: number
): Promise<SimulationResult> {
    const completedTrades = trades.filter(t => t.sellDate && t.sellPrice && t.buyPrice);
    let originalTotal = 0;
    let simulatedTotal = 0;
    let affected = 0;
    const details: SimulationResult["details"] = [];

    for (const trade of completedTrades) {
        const originalPL = ((trade.sellPrice! - trade.buyPrice) / trade.buyPrice) * 100;
        originalTotal += originalPL;

        try {
            const querySymbol = trade.symbol.endsWith(".NS") ? trade.symbol : `${trade.symbol}.NS`;
            const chartResult = await yahooFinance.chart(querySymbol, {
                period1: trade.buyDate,
                period2: trade.sellDate!,
                interval: "1d",
            });

            let highestPrice = trade.buyPrice;
            let hitTrailing = false;
            let trailingPL = originalPL;

            for (const day of (chartResult?.quotes || []) as any[]) {
                if (day.high > highestPrice) highestPrice = day.high;
                const trailingStop = highestPrice * (1 - trailingPercent / 100);

                if (day.low <= trailingStop) {
                    trailingPL = ((trailingStop - trade.buyPrice) / trade.buyPrice) * 100;
                    hitTrailing = true;
                    affected++;
                    details.push({
                        symbol: trade.symbol,
                        originalPL,
                        simulatedPL: trailingPL,
                        exitReason: `Trailing stop (-${trailingPercent}% from peak ₹${highestPrice.toFixed(0)})`,
                        exitDate: new Date(day.date).toLocaleDateString(),
                    });
                    break;
                }
            }

            if (!hitTrailing) {
                details.push({
                    symbol: trade.symbol,
                    originalPL,
                    simulatedPL: originalPL,
                    exitReason: "No change (trailing stop not hit)",
                });
            }

            simulatedTotal += hitTrailing ? trailingPL : originalPL;
        } catch {
            simulatedTotal += originalPL;
            details.push({
                symbol: trade.symbol,
                originalPL,
                simulatedPL: originalPL,
                exitReason: "Data unavailable",
            });
        }
    }

    const difference = simulatedTotal - originalTotal;
    return {
        originalPL: originalTotal,
        simulatedPL: simulatedTotal,
        difference,
        differencePercent: originalTotal !== 0 ? (difference / Math.abs(originalTotal)) * 100 : 0,
        tradesAffected: affected,
        totalTrades: completedTrades.length,
        details: details.slice(0, 20),
    };
}

// Simplified version for server-side use without live API calls
// Uses trade data already in DB to calculate what-if scenarios
export function simulateStopLossFromTrades(
    trades: Trade[],
    stopLossPercent: number
): SimulationResult {
    const completedTrades = trades.filter(t => t.sellDate && t.sellPrice && t.buyPrice);
    let originalTotal = 0;
    let simulatedTotal = 0;
    let affected = 0;
    const details: SimulationResult["details"] = [];

    for (const trade of completedTrades) {
        const originalPLPercent = ((trade.sellPrice! - trade.buyPrice) / trade.buyPrice) * 100;
        originalTotal += originalPLPercent;

        // If loss was worse than stop loss, the stop would have saved money
        if (originalPLPercent < -stopLossPercent) {
            const simulatedPLPercent = -stopLossPercent;
            simulatedTotal += simulatedPLPercent;
            affected++;
            details.push({
                symbol: trade.symbol,
                originalPL: originalPLPercent,
                simulatedPL: simulatedPLPercent,
                exitReason: `Stop loss would have limited loss to -${stopLossPercent}%`,
            });
        } else {
            simulatedTotal += originalPLPercent;
            details.push({
                symbol: trade.symbol,
                originalPL: originalPLPercent,
                simulatedPL: originalPLPercent,
                exitReason: originalPLPercent >= 0 ? "Profitable trade" : "Loss within stop limit",
            });
        }
    }

    const difference = simulatedTotal - originalTotal;
    return {
        originalPL: originalTotal,
        simulatedPL: simulatedTotal,
        difference,
        differencePercent: originalTotal !== 0 ? (difference / Math.abs(originalTotal)) * 100 : 0,
        tradesAffected: affected,
        totalTrades: completedTrades.length,
        details: details.slice(0, 20),
    };
}

export function simulateTargetProfit(
    trades: Trade[],
    targetPercent: number
): SimulationResult {
    const completedTrades = trades.filter(t => t.sellDate && t.sellPrice && t.buyPrice);
    let originalTotal = 0;
    let simulatedTotal = 0;
    let affected = 0;
    const details: SimulationResult["details"] = [];

    for (const trade of completedTrades) {
        const originalPLPercent = ((trade.sellPrice! - trade.buyPrice) / trade.buyPrice) * 100;
        originalTotal += originalPLPercent;

        // If profit exceeded target, cap it at target (exited earlier)
        if (originalPLPercent > targetPercent) {
            simulatedTotal += targetPercent;
            affected++;
            details.push({
                symbol: trade.symbol,
                originalPL: originalPLPercent,
                simulatedPL: targetPercent,
                exitReason: `Would have exited at +${targetPercent}% target`,
            });
        } else {
            simulatedTotal += originalPLPercent;
            details.push({
                symbol: trade.symbol,
                originalPL: originalPLPercent,
                simulatedPL: originalPLPercent,
                exitReason: originalPLPercent >= 0 ? "Did not reach target" : "Loss trade",
            });
        }
    }

    const difference = simulatedTotal - originalTotal;
    return {
        originalPL: originalTotal,
        simulatedPL: simulatedTotal,
        difference,
        differencePercent: originalTotal !== 0 ? (difference / Math.abs(originalTotal)) * 100 : 0,
        tradesAffected: affected,
        totalTrades: completedTrades.length,
        details: details.slice(0, 20),
    };
}

export function simulateStopLossWithTarget(
    trades: Trade[],
    stopLossPercent: number,
    targetPercent: number
): SimulationResult {
    const completedTrades = trades.filter(t => t.sellDate && t.sellPrice && t.buyPrice);
    let originalTotal = 0;
    let simulatedTotal = 0;
    let affected = 0;
    const details: SimulationResult["details"] = [];

    for (const trade of completedTrades) {
        const originalPLPercent = ((trade.sellPrice! - trade.buyPrice) / trade.buyPrice) * 100;
        originalTotal += originalPLPercent;

        let simPL = originalPLPercent;
        let reason = "No change";

        if (originalPLPercent < -stopLossPercent) {
            simPL = -stopLossPercent;
            reason = `Stop loss at -${stopLossPercent}%`;
            affected++;
        } else if (originalPLPercent > targetPercent) {
            simPL = targetPercent;
            reason = `Target exit at +${targetPercent}%`;
            affected++;
        }

        simulatedTotal += simPL;
        details.push({
            symbol: trade.symbol,
            originalPL: originalPLPercent,
            simulatedPL: simPL,
            exitReason: reason,
        });
    }

    const difference = simulatedTotal - originalTotal;
    return {
        originalPL: originalTotal,
        simulatedPL: simulatedTotal,
        difference,
        differencePercent: originalTotal !== 0 ? (difference / Math.abs(originalTotal)) * 100 : 0,
        tradesAffected: affected,
        totalTrades: completedTrades.length,
        details: details.slice(0, 20),
    };
}
