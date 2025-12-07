"use server";

import { revalidatePath } from "next/cache";
import { inngest } from "@/inngest/client";

export async function refreshFeed(subreddit?: string) {
  // Get subreddit from parameter or default to "entrepreneur"
  const targetSubreddit = subreddit || "entrepreneur";
  
  // Trigger Inngest workflow to fetch new posts and generate ideas
  // The workflow will automatically send email digests in Step 5 if new ideas are created
  try {
    await inngest.send({
      name: "app/scrape",
      data: {
        subreddit: targetSubreddit,
      },
    });
    console.log(`Inngest workflow triggered: app/scrape for subreddit "${targetSubreddit}"`);
  } catch (error) {
    // Log error but don't fail the refresh
    // In development, Inngest might not be running, which is okay
    console.warn("Could not trigger Inngest workflow (this is okay if Inngest dev server is not running):", error);
  }

  // Revalidate the dashboard page to show fresh data
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Feed refresh triggered for r/${targetSubreddit}. New ideas will be generated and emails will be sent automatically.`,
  };
}

