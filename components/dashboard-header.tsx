"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, Bell, BellOff, LogOut } from "lucide-react";
import { refreshFeed } from "@/app/actions/dashboard";
import { toggleSubscription } from "@/app/actions/subscribe";
import { signOut } from "@/app/actions/auth";
import { useTransition, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Database } from "@/types/database";

const SUBSCRIPTION_TOPIC = "all";

export function DashboardHeader() {
  const [isPending, startTransition] = useTransition();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSubscription() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("users")
          .select("subscription_topics")
          .eq("id", user.id)
          .single();

        const typedData = data as Pick<Database['public']['Tables']['users']['Row'], 'subscription_topics'> | null;
        if ((typedData?.subscription_topics as string[])?.includes(SUBSCRIPTION_TOPIC)) {
          setIsSubscribed(true);
        }
      }
      setIsLoading(false);
    }

    checkSubscription();
  }, []);

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshFeed();
      if (result?.success) {
        const messages = [];
        if (result.ideasFound !== undefined && result.ideasFound > 0) {
          messages.push(`${result.ideasFound} idea(s) found`);
        }
        if (result.emailsSent !== undefined && result.emailsSent > 0) {
          messages.push(`${result.emailsSent} email(s) sent`);
        }
        if (messages.length > 0) {
          toast.success(`Feed refreshed! ${messages.join(", ")}.`);
        } else {
          toast.success("Feed refreshed! Fetching new posts...");
        }
      }
    });
  };

  const handleToggleSubscription = () => {
    startTransition(async () => {
      const result = await toggleSubscription(SUBSCRIPTION_TOPIC);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsSubscribed(result.subscribed || false);
        toast.success(result.message || "Subscription updated");
      }
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      const result = await signOut();
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex items-center justify-between border-b border-neutral-50 bg-white px-6 py-6 sm:px-8 lg:px-12">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        Latest Ideas
      </h1>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={handleToggleSubscription}
          disabled={isPending || isLoading}
          className="gap-2"
        >
          {isSubscribed ? (
            <>
              <BellOff className="h-4 w-4" />
              Unsubscribe
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Subscribe to Updates
            </>
          )}
        </Button>
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
        <Button
          variant="outline"
          onClick={handleSignOut}
          disabled={isPending}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

