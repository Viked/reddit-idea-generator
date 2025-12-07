"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Database } from "@/types/database";

type Idea = Database["public"]["Tables"]["ideas"]["Row"];

interface IdeaCardProps {
  idea: Idea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const [showSources, setShowSources] = useState(false);
  
  // Get source IDs, handling both null and empty array cases
  const sourceIds = idea.source_ids && idea.source_ids.length > 0 ? idea.source_ids : [];
  const scoreColor =
    idea.score >= 80
      ? "bg-green-100 text-green-800 border-green-200"
      : idea.score >= 60
        ? "bg-blue-100 text-blue-800 border-blue-200"
        : "bg-yellow-100 text-yellow-800 border-yellow-200";

  return (
    <Card className="group h-full border border-neutral-100 bg-white transition-all duration-200 hover:border-neutral-200">
      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="flex-1 text-xl font-bold leading-tight tracking-tight text-neutral-900">
            {idea.title}
          </h3>
          <Badge
            variant="outline"
            className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${scoreColor}`}
          >
            {idea.score}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base leading-relaxed text-neutral-700">
          {idea.pitch}
        </p>
        <div className="rounded-lg border border-neutral-50 bg-neutral-50/30 p-3">
          <p className="text-sm italic leading-relaxed text-neutral-600">
            <span className="font-semibold text-neutral-900">Pain Point: </span>
            {idea.pain_point}
          </p>
        </div>
        {sourceIds.length > 0 && (
          <div className="border-t border-neutral-100 pt-4">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex w-full items-center justify-between text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              <span>View Sources ({sourceIds.length})</span>
              {showSources ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showSources && (
              <div className="mt-3 space-y-2">
                {sourceIds.map((sourceId) => {
                  // Sanitize sourceId for URL safety (Reddit IDs are alphanumeric, but validate)
                  const sanitizedId = sourceId?.replace(/[^a-zA-Z0-9]/g, '') || ''
                  if (!sanitizedId) return null
                  
                  return (
                    <Link
                      key={sourceId}
                      href={`https://www.reddit.com/comments/${sanitizedId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-neutral-600 underline transition-colors hover:text-neutral-900"
                    >
                      <span>View post {sanitizedId}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-end pt-2">
          <Link
            href={`https://www.reddit.com/r/entrepreneur/search?q=${encodeURIComponent(idea.pain_point.substring(0, 50))}&restrict_sr=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <span>Search on Reddit</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

