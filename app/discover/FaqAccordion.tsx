"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SourceAttribution } from "@/components/SourceAttribution";
import type { FaqAnswerResult } from "@/lib/content-pipeline";

export function FaqAccordion({ faqs }: { faqs: (FaqAnswerResult | null)[] }) {
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-blue/60 px-5 py-3">
        <HelpCircle className="h-4 w-4 text-baby-blue-foreground" />
        <p className="font-display text-base font-semibold text-baby-blue-foreground">Ask instead of search</p>
      </div>
      <CardContent className="flex flex-col divide-y divide-border pt-2">
        {faqs.map((faq) => {
          if (!faq) return null;
          const isOpen = openTopic === faq.topic;
          return (
            <div key={faq.topic} className="py-2">
              <button
                type="button"
                onClick={() => setOpenTopic(isOpen ? null : faq.topic)}
                className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm font-medium"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {isOpen && (
                <div className="flex flex-col gap-2 pb-2 pt-1 text-sm text-muted-foreground">
                  {faq.isRawFallback ? (
                    <p>{faq.rawSummary}</p>
                  ) : (
                    faq.answer.map((line, i) => <p key={i}>{line}</p>)
                  )}
                  <SourceAttribution sources={faq.sourcesUsed} />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
