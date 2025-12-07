import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase";
import { IdeaCard } from "@/components/idea-card";
import { DashboardHeader } from "@/components/dashboard-header";
import DashboardLoading from "./loading";
import { Database } from "@/types/database";

type Idea = Database["public"]["Tables"]["ideas"]["Row"];

async function IdeasList() {
  const supabase = createAdminClient();
  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  
  const typedIdeas = (ideas ?? []) as Idea[];

  if (error) {
    console.error("Error fetching ideas:", error);
    return (
      <div className="container mx-auto px-6 py-12 sm:px-8 lg:px-12">
        <p className="text-center text-base text-neutral-600">
          Failed to load ideas. Please try again later.
        </p>
      </div>
    );
  }

  if (!typedIdeas || typedIdeas.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12 sm:px-8 lg:px-12">
        <div className="rounded-lg border border-neutral-100 bg-white p-12 text-center">
          <h2 className="text-2xl font-bold text-neutral-900">
            No ideas yet
          </h2>
          <p className="mt-3 text-base text-neutral-600">
            Ideas will appear here once the system starts generating them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 sm:px-8 lg:px-12">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {typedIdeas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <DashboardHeader />
      <Suspense fallback={<DashboardLoading />}>
        <IdeasList />
      </Suspense>
    </div>
  );
}

