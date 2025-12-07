import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function IdeaCardSkeleton() {
  return (
    <Card className="border-neutral-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full rounded-md" />
        <div className="flex justify-end">
          <Skeleton className="h-5 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <IdeaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

