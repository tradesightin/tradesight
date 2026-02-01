import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, LineChart, ShieldCheck, Zap } from "lucide-react";

export function FeaturesSection() {
    return (
        <section className="container space-y-6 py-8 dark:bg-transparent md:py-12 lg:py-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                    Master Your Trading Psychology
                </h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Tradesight helps you analyze not just your P&L, but the behavior behind every trade. Sync with Zerodha and get actionable insights instantly.
                </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <Zap className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>Instant Sync</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Seamlessly connect with your Zerodha Kite account. Auto-import your trade history and portfolio in seconds.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <BarChart2 className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>Behavioral Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Understand your "Hold Winners" vs "Hold Losers" time. Detect panic selling and fomo buying patterns.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <ShieldCheck className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>Risk Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Visualize your sector concentration and position sizing. Get alerts when you deviate from your rules.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <LineChart className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>Profit Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Analyze your win rate and profit/loss ratio. Identify the setups that actually make you money.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mt-12">
                <h3 className="font-heading text-2xl leading-[1.1] sm:text-2xl md:text-4xl">
                    How it Works
                </h3>
                <div className="grid gap-8 md:grid-cols-3 mt-8">
                    <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl mb-4">1</div>
                        <h4 className="font-bold text-lg">Connect</h4>
                        <p className="text-sm text-muted-foreground mt-2">Log in via Zerodha to securely sync your tradebook.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl mb-4">2</div>
                        <h4 className="font-bold text-lg">Analyze</h4>
                        <p className="text-sm text-muted-foreground mt-2">Our algorithms crunch the numbers to find behavioral leaks.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl mb-4">3</div>
                        <h4 className="font-bold text-lg">Improve</h4>
                        <p className="text-sm text-muted-foreground mt-2">Review insights and adjust your strategy to trade better.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
