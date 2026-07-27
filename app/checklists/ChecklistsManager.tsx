"use client";

import { useState } from "react";
import { Check, ChevronLeft, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SourceAttribution } from "@/components/SourceAttribution";
import { ProgressBar } from "@/components/ProgressBar";
import { cn } from "@/lib/utils";
import type { ChecklistResult, ChecklistType } from "@/lib/content-pipeline";

interface ChecklistEntry {
  checklistType: ChecklistType;
  content: ChecklistResult | null;
  checkedItems: string[];
}

function totalItemCount(content: ChecklistResult | null): number {
  return content?.groups.reduce((sum, g) => sum + g.items.length, 0) ?? 0;
}

function SelectorCard({ entry, onOpen }: { entry: ChecklistEntry; onOpen: () => void }) {
  const { content, checkedItems } = entry;
  const total = totalItemCount(content);
  const checkedSet = new Set(checkedItems);
  const done = content?.groups.flatMap((g) => g.items).filter((item) => checkedSet.has(item)).length ?? 0;

  if (!content) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Couldn&apos;t load this checklist right now — try again shortly.
        </CardContent>
      </Card>
    );
  }

  return (
    <button type="button" onClick={onOpen} className="text-left">
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/30">
        <CardContent className="flex h-full flex-col gap-3 pt-6">
          <p className="font-display text-lg font-semibold">{content.title}</p>
          <ProgressBar done={done} total={total} />
          <p className="text-xs text-muted-foreground">
            {done}/{total} done
          </p>
        </CardContent>
      </Card>
    </button>
  );
}

function ChecklistDetail({
  entry,
  onBack,
  onToggle,
}: {
  entry: ChecklistEntry;
  onBack: () => void;
  onToggle: (item: string) => void;
}) {
  const { content, checkedItems } = entry;

  if (!content) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Couldn&apos;t load this checklist right now — try again shortly.
        </CardContent>
      </Card>
    );
  }

  const checkedSet = new Set(checkedItems);
  const total = totalItemCount(content);
  const done = content.groups.flatMap((g) => g.items).filter((item) => checkedSet.has(item)).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 pl-2">
          <ChevronLeft className="h-4 w-4" />
          All checklists
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer className="h-3.5 w-3.5" />
          Print
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 bg-baby-lavender/60 px-5 py-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-lg font-semibold text-baby-lavender-foreground">{content.title}</p>
            <span className="text-xs font-medium text-baby-lavender-foreground/70">
              {done}/{total}
            </span>
          </div>
          <ProgressBar done={done} total={total} />
        </div>
        <CardContent className="flex flex-col gap-5 pt-5">
          {content.isRawFallback && (
            <p className="text-xs italic text-muted-foreground">
              Unpolished excerpt — add an ANTHROPIC_API_KEY for a cleaner checklist.
            </p>
          )}
          {content.groups
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <div key={group.category}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.category}
                </h3>
                <ul className="flex flex-col gap-2">
                  {group.items.map((item) => {
                    const checked = checkedSet.has(item);
                    return (
                      <li key={item}>
                        <button
                          type="button"
                          onClick={() => onToggle(item)}
                          className="flex w-full items-start gap-2 rounded-md border border-transparent p-1.5 text-left text-sm transition-colors hover:border-input hover:bg-accent print:p-0"
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                              checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                            )}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </span>
                          <span className={cn(checked && "text-muted-foreground line-through")}>{item}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          <SourceAttribution sources={content.sourcesUsed} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ChecklistsManager({ initialChecklists }: { initialChecklists: ChecklistEntry[] }) {
  const [checklists, setChecklists] = useState(initialChecklists);
  const [openType, setOpenType] = useState<ChecklistType | null>(null);

  async function toggleItem(checklistType: ChecklistType, item: string) {
    const entry = checklists.find((c) => c.checklistType === checklistType);
    if (!entry) return;

    const wasChecked = entry.checkedItems.includes(item);
    const nextChecked = wasChecked
      ? entry.checkedItems.filter((i) => i !== item)
      : [...entry.checkedItems, item];

    setChecklists((prev) =>
      prev.map((c) => (c.checklistType === checklistType ? { ...c, checkedItems: nextChecked } : c))
    );

    await fetch("/api/checklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklistType, checkedItems: nextChecked }),
    });
  }

  const openEntry = checklists.find((c) => c.checklistType === openType);

  if (openEntry) {
    return (
      <ChecklistDetail
        entry={openEntry}
        onBack={() => setOpenType(null)}
        onToggle={(item) => toggleItem(openEntry.checklistType, item)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {checklists.map((entry) => (
          <SelectorCard key={entry.checklistType} entry={entry} onOpen={() => setOpenType(entry.checklistType)} />
        ))}
      </div>
    </div>
  );
}
