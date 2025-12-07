"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { signIn } from "@/app/actions/auth";
import { useTransition } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await signIn(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Check your email for the magic link!");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border border-neutral-200 bg-white p-8 shadow-sm">
          <CardHeader className="space-y-1.5 px-0">
            <CardTitle className="text-3xl font-bold text-neutral-900">
              Sign in with Magic Link
            </CardTitle>
            <CardDescription className="text-neutral-600">
              Enter your email to receive a sign-in link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-900 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-500 focus-visible:ring-purple-600 focus-visible:border-purple-600"
                  required
                  disabled={isPending}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-purple-600 text-white hover:bg-purple-700" 
                size="lg"
                disabled={isPending}
              >
                {isPending ? "Sending..." : "Send Magic Link"}
              </Button>
            </form>
            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

