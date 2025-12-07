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
import { SyncStatus } from "@/components/sync-status";
import { SubredditSelector } from "@/components/subreddit-selector";

const SUBSCRIPTION_TOPIC = "all";

export function DashboardHeader() {
  const [isPending, startTransition] = useTransition();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>("entrepreneur");

  useEffect(() => {
    // Load selected subreddit from localStorage
    const saved = localStorage.getItem("selectedSubreddit");
    if (saved) {
      setSelectedSubreddit(saved);
    }
    
    // Listen for localStorage changes
    const handleStorageChange = () => {
      const newSaved = localStorage.getItem("selectedSubreddit");
      if (newSaved) {
        setSelectedSubreddit(newSaved);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically in case storage event doesn't fire (same window)
    const checkInterval = setInterval(() => {
      const newSaved = localStorage.getItem("selectedSubreddit");
      if (newSaved && newSaved !== selectedSubreddit) {
        setSelectedSubreddit(newSaved);
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [selectedSubreddit]);
  
  useEffect(() => {
    async function checkSubscription() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data } = await supabase
          .from("users")
          .select("subscription_topics")
          .eq("id", user.id)
          .single();

        if (data) {
          const typedData = data as Pick<Database['public']['Tables']['users']['Row'], 'subscription_topics'> | null;
          const topics = (typedData?.subscription_topics || []) as string[];
          setIsSubscribed(topics.includes(SUBSCRIPTION_TOPIC));
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSubscription();
  }, []);

  const handleRefresh = () => {
    if (isSyncing) return; // Prevent multiple simultaneous syncs
    
    setIsSyncing(true);
    startTransition(async () => {
      try {
        const selectedSubreddit = localStorage.getItem("selectedSubreddit") || "entrepreneur";
        const result = await refreshFeed(selectedSubreddit);
        if (result?.success) {
          toast.success(result.message || "Feed refresh triggered. New ideas will be generated and emails will be sent automatically.");
          // Keep syncing state active - it will be cleared when sync completes (detected by timestamp change)
          // Set a timeout as fallback in case sync takes too long
          setTimeout(() => {
            if (isSyncing) {
              setIsSyncing(false);
              toast.info("Sync timeout - please check if the workflow completed successfully.");
            }
          }, 180000); // 3 minutes max
        } else {
          toast.error("Failed to refresh feed. Please try again.");
          setIsSyncing(false);
        }
      } catch (error) {
        console.error("Error refreshing feed:", error);
        toast.error("Failed to refresh feed. Please try again.");
        setIsSyncing(false);
      }
    });
  };

  const handleSyncComplete = () => {
    setIsSyncing(false);
    // Refresh the page to show new ideas
    window.location.reload();
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
      // If signOut returns (doesn't redirect), there was an error
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="border-b border-neutral-50 bg-white">
      <div className="flex items-center justify-between px-6 py-6 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Latest Ideas
          </h1>
          <SyncStatus 
            subreddit={selectedSubreddit}
            isSyncing={isSyncing} 
            onSyncComplete={handleSyncComplete} 
          />
        </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={handleToggleSubscription}
          disabled={isPending || isLoading}
          className="gap-2 border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
        >
          {isSubscribed ? (
            <>
              <BellOff className="h-4 w-4" />
              Unsubscribe
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Subscribe
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isPending || isSyncing}
          className="gap-2 border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isPending || isSyncing ? "animate-spin" : ""}`}
          />
          Refresh Feed
        </Button>
        <Button
          variant="outline"
          onClick={handleSignOut}
          disabled={isPending}
          className="gap-2 border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
      </div>
      <div className="border-t border-neutral-50 px-6 py-4 sm:px-8 lg:px-12">
        <SubredditSelector onSyncStart={() => setIsSyncing(true)} />
      </div>
    </div>
  );
}

