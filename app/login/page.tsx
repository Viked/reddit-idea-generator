import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-neutral-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-neutral-900">
              Sign in to your account
            </CardTitle>
            <CardDescription className="text-neutral-600">
              Enter your email to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-900">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="border-neutral-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-900">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="border-neutral-200"
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Sign in
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-neutral-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-neutral-900 hover:underline"
              >
                Sign up
              </Link>
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-sm text-neutral-600 hover:text-neutral-900"
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

