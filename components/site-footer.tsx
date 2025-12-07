import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-50 bg-white">
      <div className="container mx-auto px-6 py-8 sm:px-8 lg:px-12">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-neutral-600">
            © {new Date().getFullYear()} Reddit Idea Generator. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Terms
            </Link>
            <Link
              href="/about"
              className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

