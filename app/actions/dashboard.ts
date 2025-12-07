"use server";

import { revalidatePath } from "next/cache";
import { sendEmailDigest } from "@/lib/email-digest";
import { inngest } from "@/inngest/client";

export async function refreshFeed() {
  // Trigger Inngest workflow to fetch new posts and generate ideas
  try {
    await inngest.send({
      name: "app/scrape",
      data: {
        subreddit: "entrepreneur",
      },
    });
    console.log("Inngest workflow triggered: app/scrape");
  } catch (error) {
    // Log error but don't fail the refresh
    // In development, Inngest might not be running, which is okay
    console.warn("Could not trigger Inngest workflow (this is okay if Inngest dev server is not running):", error);
  }

  // Revalidate the dashboard page to show fresh data
  revalidatePath("/dashboard");

  // Send email digest to subscribed users
  // This runs asynchronously and won't block the UI
  try {
    const result = await sendEmailDigest();
    console.log(`Email digest sent: ${result.emailsSent} emails sent to ${result.usersProcessed} users`);
    return {
      success: true,
      emailsSent: result.emailsSent,
      ideasFound: result.ideasFound,
      usersProcessed: result.usersProcessed,
    };
  } catch (error) {
    // Log error but don't fail the refresh
    console.error("Error sending email digest on refresh:", error);
    return {
      success: true,
      emailsSent: 0,
      ideasFound: 0,
      usersProcessed: 0,
      emailError: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

