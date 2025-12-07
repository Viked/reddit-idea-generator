import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScanLine, Sparkles, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-neutral-50 bg-white py-24 sm:py-32 lg:py-40">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl">
                Generate Validated SaaS Ideas
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-neutral-600 sm:text-2xl lg:text-3xl">
                Discover real pain points from Reddit discussions and transform
                them into validated business opportunities.
              </p>
              <div className="mt-10">
                <Button size="lg" asChild>
                  <Link href="/login">Start Generating</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="bg-white py-24 sm:py-32 lg:py-40">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-neutral-600 sm:text-xl">
                Our AI-powered system scans Reddit to find real problems worth
                solving.
              </p>
            </div>
            <div className="mx-auto mt-20 grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-neutral-100 bg-white">
                  <ScanLine className="h-8 w-8 text-neutral-900" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-neutral-900">
                  Scan Reddit
                </h3>
                <p className="mt-3 text-base leading-relaxed text-neutral-600">
                  We monitor popular subreddits to identify trending discussions
                  and pain points.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-neutral-100 bg-white">
                  <Sparkles className="h-8 w-8 text-neutral-900" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-neutral-900">
                  Extract Pain
                </h3>
                <p className="mt-3 text-base leading-relaxed text-neutral-600">
                  AI analyzes conversations to identify genuine problems that
                  need solutions.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-neutral-100 bg-white">
                  <TrendingUp className="h-8 w-8 text-neutral-900" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-neutral-900">
                  Score Idea
                </h3>
                <p className="mt-3 text-base leading-relaxed text-neutral-600">
                  Each idea is scored based on market potential, demand, and
                  feasibility.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
