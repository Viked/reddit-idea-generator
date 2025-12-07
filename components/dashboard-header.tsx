"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { refreshFeed } from "@/app/actions/dashboard";
import { useTransition } from "react";

export function DashboardHeader() {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshFeed();
    });
  };

  return (
    <div className="flex items-center justify-between border-b border-neutral-50 bg-white px-6 py-6 sm:px-8 lg:px-12">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        Latest Ideas
      </h1>
      <Button
        variant="outline"
        onClick={handleRefresh}
        disabled={isPending}
        className="gap-2"
      >
        <RefreshCw
          className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
        />
        Refresh Feed
      </Button>
    </div>
  );
}

