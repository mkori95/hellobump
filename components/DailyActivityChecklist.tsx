"use client";

import { useState } from "react";
import { Check, ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DailyActivityChecklist({
  items,
  initialCheckedItems,
}: {
  items: string[];
  initialCheckedItems: string[];
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set(initialCheckedItems));

  if (items.length === 0) {
    return null;
  }

  async function toggle(item: string) {
    const next = new Set(checked);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setChecked(next);

    await fetch("/api/activity-checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkedItems: Array.from(next) }),
    });
  }

  const doneCount = items.filter((item) => checked.has(item)).length;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 bg-baby-peach/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-baby-peach-foreground" />
          <p className="font-display text-base font-semibold text-baby-peach-foreground">Today&apos;s activity checklist</p>
        </div>
        <span className="text-xs font-medium text-baby-peach-foreground/70">
          {doneCount}/{items.length}
        </span>
      </div>
      <CardContent className="flex flex-col gap-4 pt-4">
        <p className="text-xs text-muted-foreground">
          Tap what you got to today — resets fresh tomorrow.
        </p>
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const isChecked = checked.has(item);
            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  className="flex w-full items-start gap-2 rounded-md border border-transparent p-1.5 text-left text-sm transition-colors hover:border-input hover:bg-accent"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                      isChecked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                    )}
                  >
                    {isChecked && <Check className="h-3 w-3" />}
                  </span>
                  <span className={cn(isChecked && "text-muted-foreground line-through")}>{item}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
