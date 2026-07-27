import { Card, CardContent } from "@/components/ui/card";
import { SourceAttribution } from "@/components/SourceAttribution";
import type { PregnancyContentResult } from "@/lib/content-pipeline";

const TEASER_LIMIT = 3;

export function TodayTeaserCard({ content }: { content: PregnancyContentResult | null }) {
  if (!content) {
    return (
      <Card className="flex h-full flex-col overflow-hidden">
        <CardContent className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Couldn&apos;t load this week&apos;s content right now — try again shortly.
        </CardContent>
      </Card>
    );
  }

  const highlights = content.isRawFallback
    ? []
    : [...content.babyDevelopment, ...content.bodyChanges].slice(0, TEASER_LIMIT);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 bg-accent/50 px-5 py-3">
        <span className="text-xl leading-none" aria-hidden>
          {content.sizeEmoji}
        </span>
        <p className="font-display text-base font-semibold text-accent-foreground">
          Week {content.week}: your baby today
        </p>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {content.isRawFallback ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{content.rawSummary}</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {highlights.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">•</span>
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        )}
        <SourceAttribution sources={content.sourcesUsed} />
      </CardContent>
    </Card>
  );
}
