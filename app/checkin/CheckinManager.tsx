"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DBDailyCheckin } from "@/lib/supabase";
import { SYMPTOM_CATEGORY_LABELS, type SymptomCategory } from "@/lib/content/symptom-knowledge-base";

interface SymptomTag {
  symptom: string;
  display_name: string;
  is_red_flag: boolean;
  category: SymptomCategory | null;
}

const CATEGORY_ORDER: SymptomCategory[] = ["early_pregnancy", "physical", "emotional"];

function formatDate(iso: string, today?: string) {
  if (today && iso === today) return "Today";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function CheckinManager({
  symptoms,
  initialCheckins,
  today,
}: {
  symptoms: SymptomTag[];
  initialCheckins: DBDailyCheckin[];
  today: string;
}) {
  const [checkins, setCheckins] = useState(initialCheckins);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [viewingDate, setViewingDate] = useState<string | null>(null);

  const todayCheckin = useMemo(
    () => checkins.find((c) => c.checkin_date === today) ?? null,
    [checkins, today]
  );

  const activeEntry = (editingDate ? checkins.find((c) => c.checkin_date === editingDate) : todayCheckin) ?? null;
  const targetDate = editingDate ?? today;

  const [moodText, setMoodText] = useState(activeEntry?.mood_text ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(activeEntry?.symptoms ?? []));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<DBDailyCheckin | null>(activeEntry);
  const [foodRecommendations, setFoodRecommendations] = useState<
    { displayName: string; recommendations: string[] }[]
  >([]);

  function loadEntry(entry: DBDailyCheckin | null, date: string) {
    setEditingDate(date === today ? null : date);
    setMoodText(entry?.mood_text ?? "");
    setSelected(new Set(entry?.symptoms ?? []));
    setLastResult(entry);
    setFoodRecommendations([]);
    setError(null);
  }

  function toggleSymptom(symptom: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symptom)) next.delete(symptom);
      else next.add(symptom);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodText,
          symptoms: Array.from(selected),
          date: targetDate,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      const saved: DBDailyCheckin = data.checkin;
      setCheckins((prev) => {
        const withoutThisDate = prev.filter((c) => c.checkin_date !== saved.checkin_date);
        return [...withoutThisDate, saved].sort((a, b) => b.checkin_date.localeCompare(a.checkin_date));
      });
      setLastResult(saved);
      setFoodRecommendations(data.foodRecommendations ?? []);
      setEditingDate(null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(date: string) {
    if (!confirm("Delete this check-in? This can't be undone.")) return;
    const res = await fetch(`/api/checkins/${date}`, { method: "DELETE" });
    if (res.ok) {
      setCheckins((prev) => prev.filter((c) => c.checkin_date !== date));
      if (targetDate === date) {
        loadEntry(null, today);
      }
    }
  }

  // Every saved check-in — including today's — shows up here, sorted most
  // recent first, so nothing she just saved ever appears to "disappear".
  // The top form above is the fast-entry/edit surface; this is the record.
  const history = [...checkins].sort((a, b) => b.checkin_date.localeCompare(a.checkin_date));
  const symptomLabels = new Map(symptoms.map((s) => [s.symptom, s.display_name]));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingDate ? `Editing ${formatDate(editingDate, today)}` : "How are you feeling today?"}</CardTitle>
          <CardDescription>Free text and/or symptom tags — whatever&apos;s easiest.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="moodText">Notes (optional)</Label>
              <textarea
                id="moodText"
                value={moodText}
                onChange={(e) => setMoodText(e.target.value)}
                rows={3}
                placeholder="e.g. tired today, but otherwise good"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-4">
              <Label>Symptoms (optional)</Label>
              {(() => {
                const redFlags = symptoms.filter((s) => s.is_red_flag);
                const grouped = CATEGORY_ORDER.map((category) => ({
                  category,
                  items: symptoms.filter((s) => !s.is_red_flag && s.category === category),
                }));
                const uncategorized = symptoms.filter((s) => !s.is_red_flag && !s.category);

                function renderTag(s: SymptomTag) {
                  const isSelected = selected.has(s.symptom);
                  return (
                    <button
                      key={s.symptom}
                      type="button"
                      onClick={() => toggleSymptom(s.symptom)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 font-ui text-xs font-medium transition-colors",
                        s.is_red_flag
                          ? isSelected
                            ? "border-destructive bg-destructive text-destructive-foreground"
                            : "border-destructive/40 text-destructive hover:bg-destructive/10"
                          : isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input hover:bg-accent"
                      )}
                    >
                      {s.display_name}
                    </button>
                  );
                }

                return (
                  <>
                    {redFlags.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-destructive">
                          Urgent
                        </h3>
                        <div className="flex flex-wrap gap-2">{redFlags.map(renderTag)}</div>
                      </div>
                    )}
                    {grouped.map(
                      ({ category, items }) =>
                        items.length > 0 && (
                          <div key={category} className="flex flex-col gap-1.5">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {SYMPTOM_CATEGORY_LABELS[category]}
                            </h3>
                            <div className="flex flex-wrap gap-2">{items.map(renderTag)}</div>
                          </div>
                        )
                    )}
                    {uncategorized.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap gap-2">{uncategorized.map(renderTag)}</div>
                      </div>
                    )}
                  </>
                );
              })()}
              <p className="text-xs text-muted-foreground">
                Red-outlined tags are urgent symptoms — selecting one always shows a
                &quot;contact your doctor&quot; message instead of coping tips.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingDate ? "Update check-in" : "Save today's check-in"}
              </Button>
              {editingDate && (
                <Button type="button" variant="ghost" onClick={() => loadEntry(todayCheckin, today)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {lastResult?.has_red_flag && lastResult.response_text && (
            <div className="mt-5 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              <p className="mb-1 font-semibold">Please contact your doctor</p>
              <p className="whitespace-pre-line">{lastResult.response_text}</p>
            </div>
          )}

          {lastResult && !lastResult.has_red_flag && lastResult.symptoms.length > 0 && (
            <div className="mt-5 rounded-md border border-primary/30 bg-accent p-4 text-sm text-accent-foreground">
              <p className="mb-2 font-medium">Symptoms logged</p>
              <div className="flex flex-wrap gap-1.5">
                {lastResult.symptoms.map((s) => (
                  <span key={s} className="rounded-full border border-current/30 px-2.5 py-1 font-ui text-xs">
                    {symptomLabels.get(s) ?? s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!lastResult?.has_red_flag && foodRecommendations.length > 0 && (
            <div className="mt-3 rounded-md border border-primary/30 bg-accent/50 p-4 text-sm">
              <p className="mb-2 font-semibold text-foreground">Foods that might help</p>
              <div className="flex flex-col gap-2">
                {foodRecommendations.map((group) => (
                  <div key={group.displayName}>
                    <p className="text-xs font-medium text-muted-foreground">{group.displayName}</p>
                    <ul className="flex flex-col gap-1 text-muted-foreground">
                      {group.recommendations.map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Check-in history</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {history.map((c) => {
            const isViewing = viewingDate === c.checkin_date;
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-3 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{formatDate(c.checkin_date, today)}</p>
                      {c.mood_text && !isViewing && (
                        <p className="line-clamp-1 text-sm text-muted-foreground">{c.mood_text}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingDate(isViewing ? null : c.checkin_date)}
                      >
                        {isViewing ? "Hide" : "View"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => loadEntry(c, c.checkin_date)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(c.checkin_date)}>
                        Delete
                      </Button>
                    </div>
                  </div>

                  {isViewing && (
                    <div className="flex flex-col gap-3 border-t border-border pt-3 text-sm">
                      {c.mood_text && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Notes
                          </p>
                          <p className="mt-1 whitespace-pre-line text-foreground">{c.mood_text}</p>
                        </div>
                      )}
                      {c.symptoms.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Symptoms logged
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {c.symptoms.map((s) => (
                              <span
                                key={s}
                                className="rounded-full border border-input px-2.5 py-1 font-ui text-xs"
                              >
                                {symptomLabels.get(s) ?? s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {c.has_red_flag && c.response_text && (
                        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-destructive">
                          <p className="mb-1 font-semibold">Please contact your doctor</p>
                          <p className="whitespace-pre-line">{c.response_text}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
