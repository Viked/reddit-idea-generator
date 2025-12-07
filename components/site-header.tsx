import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-50 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 sm:px-8 lg:px-12">
        <Link href="/" className="text-xl font-bold tracking-tight text-neutral-900">
          Reddit Idea Generator
        </Link>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

