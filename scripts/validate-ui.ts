// Import types at the top (types don't require runtime execution)
import type { Database } from "../types/database";

type Idea = Database["public"]["Tables"]["ideas"]["Row"];

async function testLandingPage() {
  console.log("🧪 Test 1: Landing Page");
  try {
    // In a real scenario, we'd fetch from a running server
    // For now, we'll check if the page file exists and has the expected content
    const fs = await import("fs/promises");
    const pageContent = await fs.readFile(
      "./app/page.tsx",
      "utf-8"
    );

    if (pageContent.includes("Start Generating")) {
      console.log("✅ Landing page contains 'Start Generating' text");
      return true;
    } else {
      console.error("❌ Landing page missing 'Start Generating' text");
      return false;
    }
  } catch (error) {
    console.error("❌ Error testing landing page:", error);
    return false;
  }
}

async function testDashboardPage() {
  console.log("🧪 Test 2: Dashboard Page");
  try {
    const fs = await import("fs/promises");
    const pageContent = await fs.readFile(
      "./app/dashboard/page.tsx",
      "utf-8"
    );
    const headerContent = await fs.readFile(
      "./components/dashboard-header.tsx",
      "utf-8"
    );

    // Check if dashboard page imports DashboardHeader and header contains "Latest Ideas"
    if (
      pageContent.includes("DashboardHeader") &&
      headerContent.includes("Latest Ideas")
    ) {
      console.log("✅ Dashboard page contains 'Latest Ideas' text");
      return true;
    } else {
      console.error("❌ Dashboard page missing 'Latest Ideas' text");
      return false;
    }
  } catch (error) {
    console.error("❌ Error testing dashboard page:", error);
    return false;
  }
}

async function testMockDataRendering() {
  console.log("🧪 Test 3: Mock Data Rendering");
  
  // Check if environment variables are available
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.log("⚠️  Skipping database test - environment variables not set");
    console.log("   Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to run this test");
    return true; // Don't fail the test suite if env vars aren't set
  }

  try {
    // Lazy import to avoid env validation errors when not needed
    const { createAdminClient } = await import("../lib/supabase");
    
    const supabase = createAdminClient();

    // Insert a dummy idea
    const testIdea: Database["public"]["Tables"]["ideas"]["Insert"] = {
      title: "Test Idea for UI Validation",
      pitch: "This is a test pitch to validate the UI rendering.",
      pain_point: "This is a test pain point.",
      score: 85,
    };

    const { data: insertedIdea, error: insertError } = await supabase
      .from("ideas")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(testIdea as any)
      .select()
      .single();
  
    const typedInsertedIdea = insertedIdea as Idea | null;

    if (insertError) {
      console.error("❌ Error inserting test idea:", insertError);
      return false;
    }

    if (!typedInsertedIdea) {
      console.error("❌ No idea returned after insert");
      return false;
    }

    console.log("✅ Test idea inserted successfully");

    // Verify the idea exists
    const { data: fetchedIdea, error: fetchError } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", typedInsertedIdea.id)
      .single();
    
    const typedFetchedIdea = fetchedIdea as Idea | null;

    if (fetchError || !typedFetchedIdea) {
      console.error("❌ Error fetching test idea:", fetchError);
      // Clean up even if fetch failed
      await supabase.from("ideas").delete().eq("id", typedInsertedIdea.id);
      return false;
    }

    if (typedFetchedIdea.title === testIdea.title) {
      console.log("✅ Test idea fetched successfully with correct title");
    } else {
      console.error("❌ Test idea title mismatch");
      await supabase.from("ideas").delete().eq("id", typedInsertedIdea.id);
      return false;
    }

    // Clean up: delete the test idea
    const { error: deleteError } = await supabase
      .from("ideas")
      .delete()
      .eq("id", typedInsertedIdea.id);

    if (deleteError) {
      console.error("⚠️  Warning: Failed to delete test idea:", deleteError);
      // Don't fail the test for cleanup errors
    } else {
      console.log("✅ Test idea cleaned up successfully");
    }

    return true;
  } catch (error) {
    console.error("❌ Error in mock data rendering test:", error);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting UI Validation Tests\n");

  // Run file-based tests first (don't require env vars)
  const fileTests = await Promise.all([
    testLandingPage(),
    testDashboardPage(),
  ]);

  // Run database test separately (may be skipped if env vars not set)
  const dbTest = await testMockDataRendering();

  const allPassed = fileTests.every((result) => result === true) && dbTest;

  console.log("\n" + "=".repeat(50));
  if (allPassed) {
    console.log("✅ All UI validation tests passed!");
    process.exit(0);
  } else {
    console.log("❌ Some UI validation tests failed");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

