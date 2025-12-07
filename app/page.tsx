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
        <section className="border-b border-neutral-100 bg-white py-16 sm:py-24 lg:py-32">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-4xl">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                  BEST SOFTWARE SERVICE
                </span>
              </div>
              
              {/* Headline */}
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                Create & analytics all necessaries
              </h1>
              
              {/* Description */}
              <p className="mt-6 text-lg leading-relaxed text-neutral-600 sm:text-xl">
                Manage your all documents transparent, safe and secure. We provide world&apos;s best platform for generating validated SaaS ideas from Reddit discussions.
              </p>
              
              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  variant="purple"
                  asChild
                >
                  <Link href="/login">Get Started</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                >
                  <Link href="/#feature">Explore More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition / Feature Section */}
        <section id="feature" className="bg-white py-16 sm:py-24 lg:py-32">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
                How It Works
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
                Our AI-powered system scans Reddit to find real problems worth
                solving.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-neutral-100 bg-white shadow-sm">
                  <ScanLine className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-neutral-900">
                  Scan Reddit
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  We monitor popular subreddits to identify trending discussions
                  and pain points.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-neutral-100 bg-white shadow-sm">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-neutral-900">
                  Extract Pain
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  AI analyzes conversations to identify genuine problems that
                  need solutions.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-neutral-100 bg-white shadow-sm">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-neutral-900">
                  Score Idea
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
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
