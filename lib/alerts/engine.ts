import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications/email";
import yahooFinance from "yahoo-finance2";
import { RSI, SMA } from "technicalindicators";

export async function checkAlerts() {
    console.log("Starting Alert Check Job...");

    // 1. Fetch active rules
    // In a real app, you'd batch this or use a queue
    const rules = await db.alertRule.findMany({
        where: { isActive: true },
        include: { user: true }
    });

    console.log(`Found ${rules.length} active rules.`);

    for (const rule of rules) {
        try {
            const params = rule.parameters as any; // e.g. { symbol: "RELIANCE", indicator: "RSI", condition: "GT", value: 70 }
            const symbol = params.symbol;
            if (!symbol) continue;

            // 2. Fetch Data needed for rule
            // Optimization: Group rules by symbol to reduce API calls
            const querySymbol = symbol.endsWith(".NS") ? symbol : `${symbol}.NS`;

            // Fetch 200 days for indicators
            const chartResult = await yahooFinance.chart(querySymbol, {
                period1: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
                period2: new Date(),
                interval: "1d"
            });

            const quotes = chartResult?.quotes;
            if (!quotes || quotes.length < 50) continue;
            const closes = quotes.map((r: any) => r.close).filter((v: any) => v != null);
            const currentPrice = closes[closes.length - 1];

            let specificValue = 0;
            let triggered = false;
            let triggerMessage = "";

            // 3. Evaluate Rule
            if (params.indicator === "PRICE") {
                specificValue = currentPrice;
                if (params.condition === "GT" && currentPrice > params.value) triggered = true;
                if (params.condition === "LT" && currentPrice < params.value) triggered = true;
                triggerMessage = `Price is ${currentPrice.toFixed(2)}`;
            }
            else if (params.indicator === "RSI") {
                const rsiValues = RSI.calculate({ period: 14, values: closes });
                const currentRSI = rsiValues[rsiValues.length - 1];
                specificValue = currentRSI;
                if (params.condition === "GT" && currentRSI > params.value) triggered = true;
                if (params.condition === "LT" && currentRSI < params.value) triggered = true;
                triggerMessage = `RSI is ${currentRSI.toFixed(1)}`;
            }

            // 4. Trigger Notification if matched
            if (triggered) {
                // Check if already triggered recently to avoid spam? 
                // Phase 6 MVP: Just create Alert record

                await db.alert.create({
                    data: {
                        userId: rule.userId,
                        alertRuleId: rule.id,
                        symbol: symbol,
                        message: `${rule.ruleName} Triggered: ${triggerMessage}`,
                        priority: "HIGH"
                    }
                });

                await sendNotification(
                    rule.user.id,
                    `Alert: ${symbol} - ${rule.ruleName}`,
                    `Your alert rule "${rule.ruleName}" was triggered.\n${triggerMessage}\nLink: http://localhost:3000/dashboard/alerts`
                );

                console.log(`TRIGGERED: ${rule.ruleName} for User ${rule.user.email}`);

                // Optional: Deactivate one-time rules here
            }

        } catch (e) {
            console.error(`Failed to process rule ${rule.id}`, e);
        }
    }

    return { processed: rules.length };
}
