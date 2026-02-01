import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart2 } from "lucide-react";
import { FeaturesSection } from "@/components/landing/features-section";

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
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-lg sm:leading-8 text-balance">
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

        <section id="features">
          <FeaturesSection />
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
