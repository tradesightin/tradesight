import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart2, ShieldAlert, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <BarChart2 className="h-6 w-6" />
            <span>Review & Rule</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
              Stop Losing Money in the <span className="text-primary">Stock Market</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 text-balance">
              Discover why you lose money. See the behavioral patterns you can't see yourself.
              Review your trades, follow the rules, and stop selling winners too early.
            </p>
            <div className="space-x-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features" className="inline-block">
                <Button variant="outline" size="lg">Learn More</Button>
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              Features
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Review & Rule helps you identify behavioral flaws and fix them with data.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <BarChart2 className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                  <h3 className="font-bold">Pattern Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect if you hold losers too long or sell winners too early.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <Zap className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                  <h3 className="font-bold">Stage Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Instantly see if a stock is in Stage 2 (Advancing) or Stage 4 (Declining).
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <ShieldAlert className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                  <h3 className="font-bold">Smart Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your rules are triggered or stages change.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for Indian Investors.
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Review & Rule is an analytics tool, not an investment advisor. <br />
            We do not provide investment advice. All decisions are your responsibility.
          </p>
        </div>
      </footer>
    </div>
  );
}
