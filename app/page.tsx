import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart2, Shield, Smartphone } from "lucide-react";
import { FeaturesSection } from "@/components/landing/features-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <BarChart2 className="h-6 w-6" />
            <span>Review & Rule</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="container relative flex max-w-[64rem] flex-col items-center gap-6 text-center py-16 sm:py-24 lg:py-32">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
              <Smartphone className="mr-2 h-3.5 w-3.5" />
              Free for Indian Investors
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
              Stop Losing Money in the <span className="text-primary">Stock Market</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-lg sm:leading-8 text-balance">
              Discover why you lose money. See the behavioral patterns you can&apos;t see yourself.
              Review your trades, follow the rules, and stop selling winners too early.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">Learn More</Button>
              </a>
            </div>
            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Zerodha Connected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-green-500" />
                <span>No Investment Advice</span>
              </div>
              <div className="flex items-center gap-1.5 hidden sm:flex">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Analytics Only</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t bg-muted/30">
          <FeaturesSection />
        </section>

        {/* CTA Section */}
        <section className="border-t">
          <div className="container py-16 sm:py-24 text-center">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">Ready to improve your trading?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Connect your Zerodha account, see your patterns, and make data-driven decisions. It&apos;s completely free.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 md:px-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BarChart2 className="h-4 w-4 text-primary" />
            <span>Review & Rule</span>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-xl">
            Review & Rule is an analytics tool, not an investment advisor.
            We do not provide investment advice or recommendations.
            All trading and investment decisions are your sole responsibility.
            Past performance does not guarantee future results.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for Indian Investors
          </p>
        </div>
      </footer>
    </div>
  );
}
