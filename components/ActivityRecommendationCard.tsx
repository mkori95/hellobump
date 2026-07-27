import { Footprints } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SourceAttribution } from "@/components/SourceAttribution";
import type { ActivityContentResult } from "@/lib/content-pipeline";

export function ActivityRecommendationCard({ recommendation }: { recommendation: ActivityContentResult | null }) {
  if (!recommendation) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Couldn&apos;t load exercise guidance right now — try again shortly.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-mint/60 px-5 py-3">
        <Footprints className="h-4 w-4 text-baby-mint-foreground" />
        <p className="font-display text-base font-semibold text-baby-mint-foreground">This trimester</p>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {recommendation.isRawFallback ? (
          <p className="text-sm text-muted-foreground">{recommendation.rawSummary}</p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            {recommendation.recommendations.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">•</span>
                <div>
                  <span className="font-medium text-foreground">{item.label}.</span>{" "}
                  <span>{item.description}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <SourceAttribution sources={recommendation.sourcesUsed} />
      </CardContent>
    </Card>
  );
}
