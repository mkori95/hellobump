import { Soup } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SourceAttribution } from "@/components/SourceAttribution";
import type { FoodRecommendationsResult } from "@/lib/content-pipeline";

export function FoodRecommendationCard({ recommendation }: { recommendation: FoodRecommendationsResult | null }) {
  const items = recommendation?.recommendations ?? [];

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-yellow/60 px-5 py-3">
        <Soup className="h-4 w-4 text-baby-yellow-foreground" />
        <p className="font-display text-base font-semibold text-baby-yellow-foreground">
          Foods for this trimester
        </p>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {items.length > 0 ? (
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load food suggestions right now — try again shortly.
          </p>
        )}
        {recommendation && <SourceAttribution sources={recommendation.sourcesUsed} />}
      </CardContent>
    </Card>
  );
}
