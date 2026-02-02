import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Bell, FlaskConical, LineChart, Layers, ShieldCheck, Zap, Target } from "lucide-react";

export function FeaturesSection() {
    return (
        <section className="container space-y-6 py-8 dark:bg-transparent md:py-12 lg:py-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
                    Master Your Trading Psychology
                </h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Review & Rule helps you analyze not just your P&L, but the behavior behind every trade. Sync with Zerodha and get actionable insights instantly.
                </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                <Card className="border-2 hover:border-primary/30 transition-colors">
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
                <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <BarChart2 className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>Behavioral Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Understand your &quot;Hold Winners&quot; vs &quot;Hold Losers&quot; time. Detect panic selling and FOMO buying patterns.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <Layers className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>Stage Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Stan Weinstein&apos;s 4-stage methodology. Know exactly which stage each stock is in - Basing, Advancing, Topping, or Declining.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <Target className="h-10 w-10 text-green-500 mb-2" />
                        <CardTitle>Green & Red Flags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Automated technical flag system. See bullish and bearish signals at a glance for every stock in your portfolio.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <FlaskConical className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>&quot;What If&quot; Simulator</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Test different strategies on your past trades. What if you used a 15% stop loss? See the difference instantly.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader>
                        <Bell className="h-10 w-10 text-amber-500 mb-2" />
                        <CardTitle>Smart Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Get notified on stage transitions, critical signals, and when your custom rules trigger. Never miss a signal again.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mt-16">
                <h3 className="font-heading text-2xl leading-[1.1] sm:text-2xl md:text-4xl font-bold">
                    How it Works
                </h3>
                <div className="grid gap-8 md:grid-cols-3 mt-8">
                    <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4 shadow-lg">1</div>
                        <h4 className="font-bold text-lg">Connect</h4>
                        <p className="text-sm text-muted-foreground mt-2">Link your Zerodha account to securely sync your tradebook and portfolio.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4 shadow-lg">2</div>
                        <h4 className="font-bold text-lg">Analyze</h4>
                        <p className="text-sm text-muted-foreground mt-2">Our algorithms identify behavioral patterns, stage analysis, and technical signals in your trades.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4 shadow-lg">3</div>
                        <h4 className="font-bold text-lg">Improve</h4>
                        <p className="text-sm text-muted-foreground mt-2">Review insights, set up rules, and use the simulator to refine your strategy.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
