"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const POPULAR_SUBREDDITS = [
  "entrepreneur",
  "startups",
  "SaaS",
  "indiebiz",
  "sideproject",
  "EntrepreneurRideAlong",
];

export function SubredditSelector({ onSyncStart }: { onSyncStart?: () => void }) {
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>("entrepreneur");
  const [customSubreddit, setCustomSubreddit] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load saved subreddit preference from localStorage
    const saved = localStorage.getItem("selectedSubreddit");
    if (saved) {
      setSelectedSubreddit(saved);
    }
  }, []);

  const handleSubredditSelect = async (subreddit: string) => {
    // Don't trigger if already saving/syncing
    if (isSaving) return;
    
    setSelectedSubreddit(subreddit);
    localStorage.setItem("selectedSubreddit", subreddit);
    setIsSaving(true);
    
    // Notify parent that sync is starting
    if (onSyncStart) {
      onSyncStart();
    }
    
    // Trigger workflow with selected subreddit via server action
    try {
      const { refreshFeed } = await import("@/app/actions/dashboard");
      await refreshFeed(subreddit);
    } catch (error) {
      console.error("Error triggering workflow:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSubreddit.trim().toLowerCase();
    if (trimmed) {
      // Remove 'r/' prefix if present
      const subreddit = trimmed.replace(/^r\//, "");
      handleSubredditSelect(subreddit);
      setCustomSubreddit("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-neutral-900 mb-2 block">
          Select Subreddit
        </label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SUBREDDITS.map((sub) => {
            const isSelected = selectedSubreddit === sub.toLowerCase();
            return (
              <button
                key={sub}
                type="button"
                onClick={() => handleSubredditSelect(sub.toLowerCase())}
                disabled={isSaving}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isSelected
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSelected && (
                  <Check className="h-4 w-4" />
                )}
                r/{sub.toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>
      <form onSubmit={handleCustomSubmit} className="group flex items-stretch rounded-full border border-neutral-200 bg-white focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-600 focus-within:ring-offset-0 transition-all h-10 overflow-hidden p-px">
        <Input
          type="text"
          placeholder="Enter custom subreddit (e.g., 'startups' or 'r/startups')"
          value={customSubreddit}
          onChange={(e) => setCustomSubreddit(e.target.value)}
          className="flex-1 border-0 bg-transparent px-4 h-full text-neutral-900 placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:outline-none"
          disabled={isSaving}
        />
        <Button 
          type="submit" 
          disabled={isSaving || !customSubreddit.trim()}
          className="h-full rounded-r-full bg-neutral-100 text-neutral-900 hover:bg-neutral-200 group-focus-within:bg-purple-600 group-focus-within:text-white group-focus-within:hover:bg-purple-700 border-0 px-6 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          Add
        </Button>
      </form>
    </div>
  );
}

