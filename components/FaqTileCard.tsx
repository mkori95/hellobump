import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SourceAttribution } from "@/components/SourceAttribution";
import { cn } from "@/lib/utils";
import type { FaqAnswerResult } from "@/lib/content-pipeline";

const TINTS = {
  peach: "bg-baby-peach/60 text-baby-peach-foreground",
  mint: "bg-baby-mint/60 text-baby-mint-foreground",
  blue: "bg-baby-blue/60 text-baby-blue-foreground",
  yellow: "bg-baby-yellow/60 text-baby-yellow-foreground",
  lavender: "bg-baby-lavender/60 text-baby-lavender-foreground",
} as const;

export function FaqTileCard({
  title,
  icon: Icon,
  answer,
  tint = "peach",
}: {
  title: string;
  icon: LucideIcon;
  answer: FaqAnswerResult | null;
  tint?: keyof typeof TINTS;
}) {
  const [bgClass, textClass] = TINTS[tint].split(" ");

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className={cn("flex items-center gap-2 px-5 py-3", bgClass)}>
        <Icon className={cn("h-4 w-4", textClass)} />
        <p className={cn("font-display text-base font-semibold", textClass)}>{title}</p>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {answer && (answer.isRawFallback ? answer.rawSummary : answer.answer.length > 0) ? (
          <>
            {answer.isRawFallback ? (
              <p className="text-sm text-muted-foreground">{answer.rawSummary}</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {answer.answer.map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
            <SourceAttribution sources={answer.sourcesUsed} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Couldn&apos;t load this right now — try again shortly.</p>
        )}
      </CardContent>
    </Card>
  );
}
