"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export function SiteHeader() {
  const pathname = usePathname();
  
  return (
    <header className="border-b border-neutral-100 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            Reddit Idea Generator
          </span>
        </Link>
        
        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/"
                ? "text-purple-600 underline decoration-purple-600 underline-offset-4"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Home
          </Link>
          <Link
            href="/#feature"
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Feature
          </Link>
        </nav>
        
        {/* Auth Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="border-neutral-200 bg-neutral-900 text-white hover:bg-neutral-800"
            asChild
          >
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

