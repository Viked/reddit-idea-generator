"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import { Loader2 } from "lucide-react";

type Subreddit = Database['public']['Tables']['subreddits']['Row'];

export function SyncStatus({ 
  subreddit, 
  isSyncing, 
  onSyncComplete 
}: { 
  subreddit?: string; 
  isSyncing?: boolean;
  onSyncComplete?: () => void;
}) {
  const [lastScrapedAt, setLastScrapedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSubreddit, setCurrentSubreddit] = useState<string>("entrepreneur");
  const syncStartTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    // Get selected subreddit from localStorage or use prop
    const saved = localStorage.getItem("selectedSubreddit");
    const sub = subreddit || saved || "entrepreneur";
    
    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      if (sub !== currentSubreddit) {
        setCurrentSubreddit(sub);
      }
    }, 0);
    
    // Listen for localStorage changes (when subreddit is changed in SubredditSelector)
    const handleStorageChange = () => {
      const newSaved = localStorage.getItem("selectedSubreddit");
      if (newSaved && newSaved !== currentSubreddit) {
        setCurrentSubreddit(newSaved);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically in case storage event doesn't fire (same window)
    const checkInterval = setInterval(() => {
      const newSaved = localStorage.getItem("selectedSubreddit");
      if (newSaved && newSaved !== currentSubreddit) {
        setCurrentSubreddit(newSaved);
      }
    }, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [subreddit, currentSubreddit]);

  // Capture timestamp when sync starts
  useEffect(() => {
    if (isSyncing && syncStartTimestampRef.current === null) {
      // Sync just started - capture current timestamp for the current subreddit
      syncStartTimestampRef.current = lastScrapedAt;
      console.log('[SyncStatus] Sync started for subreddit:', currentSubreddit, 'captured timestamp:', lastScrapedAt);
    } else if (!isSyncing) {
      // Sync ended - reset
      syncStartTimestampRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncing, currentSubreddit]);

  useEffect(() => {
    async function fetchLastScraped() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("subreddits")
        .select("last_scraped_at, name")
        .eq("name", currentSubreddit.toLowerCase())
        .maybeSingle(); // Use maybeSingle() to handle missing records gracefully

      if (!error && data) {
        const subreddit = data as Pick<Subreddit, 'last_scraped_at' | 'name'>;
        const newTimestamp = subreddit.last_scraped_at;
        const previousTimestamp = lastScrapedAt;
        
        // Check if timestamp changed while syncing (sync completed)
        if (isSyncing) {
          const startTimestamp = syncStartTimestampRef.current;
          
          // Sync completed if:
          // 1. We had no timestamp before and now we have one, OR
          // 2. The timestamp changed from when we started
          if (startTimestamp === null && newTimestamp !== null) {
            // Went from no timestamp to having one - sync completed!
            console.log('[SyncStatus] Sync completed: timestamp appeared', { 
              subreddit: currentSubreddit,
              newTimestamp 
            });
            if (onSyncComplete) {
              onSyncComplete();
            }
            // Trigger page reload to show new ideas
            setTimeout(() => {
              window.location.reload();
            }, 500);
          } else if (startTimestamp !== null && newTimestamp !== null) {
            // Compare timestamps - if new one is different, sync completed
            // We check for any change because the workflow updates the timestamp at the end
            if (newTimestamp !== startTimestamp) {
              const startTime = new Date(startTimestamp).getTime();
              const newTime = new Date(newTimestamp).getTime();
              console.log('[SyncStatus] Sync completed: timestamp changed', { 
                subreddit: currentSubreddit,
                startTimestamp, 
                newTimestamp,
                diffMs: newTime - startTime 
              });
              if (onSyncComplete) {
                onSyncComplete();
              }
              // Trigger page reload to show new ideas
              setTimeout(() => {
                window.location.reload();
              }, 500);
            } else {
              // Timestamp hasn't changed yet - still syncing
              // Only log occasionally to avoid spam
              if (Math.random() < 0.1) { // Log ~10% of the time
                console.log('[SyncStatus] Still syncing...', {
                  subreddit: currentSubreddit,
                  startTimestamp,
                  newTimestamp
                });
              }
            }
          } else if (previousTimestamp !== newTimestamp && newTimestamp !== null) {
            // Fallback: if timestamp changed while syncing (even if we didn't capture start)
            console.log('[SyncStatus] Sync completed: timestamp changed (fallback)', {
              subreddit: currentSubreddit,
              previousTimestamp,
              newTimestamp
            });
            if (onSyncComplete) {
              onSyncComplete();
            }
            // Trigger page reload to show new ideas
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        }
        
        setLastScrapedAt(newTimestamp);
      } else {
        // Handle error or missing record
        if (error) {
          // Only log actual errors (not "not found" which is expected for new subreddits)
          if (error.code !== 'PGRST116') {
            console.error('[SyncStatus] Error fetching sync status:', error, {
              subreddit: currentSubreddit
            });
          }
        }
        // Set to null if record doesn't exist (this is expected for new subreddits)
        setLastScrapedAt(null);
      }
      setIsLoading(false);
    }

    // Initial fetch
    fetchLastScraped();
    
    // If syncing, poll more frequently (every 3 seconds)
    // Otherwise, poll every minute
    const pollInterval = isSyncing ? 3000 : 60000;
    
    const intervalId = setInterval(fetchLastScraped, pollInterval);
    
    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSubreddit, isSyncing, onSyncComplete]);

  if (isLoading) {
    return (
      <span className="text-sm text-neutral-600">Loading sync status...</span>
    );
  }

  // Show syncing indicator when workflow is running
  if (isSyncing) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin text-neutral-900" />
        <span className="text-sm text-neutral-600">Syncing...</span>
      </div>
    );
  }

  if (!lastScrapedAt) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-yellow-500" />
        <span className="text-sm text-neutral-600">Never synced</span>
      </div>
    );
  }

  const lastScraped = new Date(lastScrapedAt);
  const now = new Date();
  const diffMs = now.getTime() - lastScraped.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = diffMs / (1000 * 60 * 60);

  const statusColor = diffHours < 6 ? "bg-green-500" : "bg-yellow-500";
  const timeAgo =
    diffMinutes < 1
      ? "Just now"
      : diffMinutes < 60
      ? `${diffMinutes} min ago`
      : diffHours < 24
      ? `${Math.floor(diffHours)}h ago`
      : `${Math.floor(diffHours / 24)}d ago`;

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${statusColor}`} />
      <span className="text-sm text-neutral-600">Last synced: {timeAgo}</span>
    </div>
  );
}

