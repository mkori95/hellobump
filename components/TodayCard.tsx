"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SourceAttribution } from "@/components/SourceAttribution";
import { cn } from "@/lib/utils";
import type { PregnancyContentResult } from "@/lib/content-pipeline";

const VISIBLE_LIMIT = 4;
// Cap how tall the list can grow once expanded — long lists scroll inside
// this box instead of pushing the rest of the page down indefinitely.
const EXPANDED_MAX_HEIGHT = "max-h-60";

function BulletList({ items }: { items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, VISIBLE_LIMIT);
  const hiddenCount = items.length - VISIBLE_LIMIT;

  return (
    <>
      <ul
        className={cn(
          "flex flex-col gap-2 text-sm text-muted-foreground",
          expanded && `${EXPANDED_MAX_HEIGHT} overflow-y-auto pr-1`
        )}
      >
        {visible.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Show {hiddenCount} more <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </>
  );
}

export function TodayCard({ content }: { content: PregnancyContentResult }) {
  return (
    <Card className="h-full overflow-hidden">
      <div className="flex items-center gap-3 bg-accent/50 px-5 py-4">
        <span className="text-3xl leading-none" aria-hidden>
          {content.sizeEmoji}
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-accent-foreground">
            Week {content.week}: your baby today
          </p>
          {content.sizeComparison && (
            <p className="font-display text-sm italic text-accent-foreground/80">
              About the size of {content.sizeComparison}
            </p>
          )}
        </div>
      </div>
      <CardContent className="flex flex-col gap-6 pt-5">
        {content.isRawFallback ? (
          <div>
            <p className="mb-2 text-xs italic text-muted-foreground">
              Unpolished excerpt from the source below — add an ANTHROPIC_API_KEY to get a warmly
              synthesized summary instead.
            </p>
            <p className="text-sm text-muted-foreground">{content.rawSummary}</p>
          </div>
        ) : (
          <>
            {content.babyDevelopment.length > 0 && (
              <div>
                <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-foreground">
                  What&apos;s developing
                </h3>
                <BulletList items={content.babyDevelopment} />
              </div>
            )}
            {content.bodyChanges.length > 0 && (
              <div className="border-t border-border pt-5">
                <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-foreground">
                  Changes for you
                </h3>
                <BulletList items={content.bodyChanges} />
              </div>
            )}
            {content.funFacts.length > 0 && (
              <div className="rounded-md bg-secondary p-3">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Did you know?
                </h3>
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {content.funFacts.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        <SourceAttribution sources={content.sourcesUsed} />
      </CardContent>
    </Card>
  );
}
