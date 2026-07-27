"use client";

import { useMemo, useState } from "react";
import { Heart, Sparkles, ChevronDown, ChevronUp, SlidersHorizontal, Wand2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BABY_NAME_STYLE_TAGS } from "@/lib/content/baby-names-seed";
import type { DBBabyName } from "@/lib/supabase";
import type { NameSuggestion, NameLookupSuggestion } from "@/lib/baby-names";

const GENDER_LABELS: Record<string, string> = { girl: "Girl", boy: "Boy", unisex: "Unisex" };

const VISIBLE_LIMIT = 24;

type SortOption = "name-asc" | "name-desc" | "origin" | "gender";

const SORT_LABELS: Record<SortOption, string> = {
  "name-asc": "Name (A → Z)",
  "name-desc": "Name (Z → A)",
  origin: "Origin",
  gender: "Gender",
};

function sortNames(names: DBBabyName[], sortBy: SortOption): DBBabyName[] {
  const sorted = [...names];
  switch (sortBy) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "origin":
      return sorted.sort((a, b) => a.origin.localeCompare(b.origin) || a.name.localeCompare(b.name));
    case "gender":
      return sorted.sort((a, b) => a.gender.localeCompare(b.gender) || a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

const selectClass =
  "flex h-9 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function TagChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 font-ui text-[11px] font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}

function NameCard({
  name,
  saved,
  onToggleSave,
  whyItFits,
}: {
  name: Pick<DBBabyName, "id" | "name" | "gender" | "origin" | "meaning" | "style_tags">;
  saved: boolean;
  onToggleSave: () => void;
  whyItFits?: string;
}) {
  const visibleTags = name.style_tags.slice(0, 2);
  const extraCount = name.style_tags.length - visibleTags.length;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">{name.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {GENDER_LABELS[name.gender] ?? name.gender} · {name.origin}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
            className="shrink-0 rounded-full p-1 transition-colors hover:bg-accent"
          >
            <Heart className={cn("h-3.5 w-3.5", saved ? "fill-primary text-primary" : "text-muted-foreground")} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">&ldquo;{name.meaning}&rdquo;</p>
        {whyItFits && <p className="text-xs italic text-accent-foreground/80">{whyItFits}</p>}
        {visibleTags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {visibleTags.map((tag) => (
              <span key={tag} className="rounded-full bg-secondary px-1.5 py-0.5 font-ui text-[10px] text-secondary-foreground">
                {tag}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="rounded-full bg-secondary px-1.5 py-0.5 font-ui text-[10px] text-secondary-foreground">
                +{extraCount}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NamesManager({
  initialNames,
  initialSavedIds,
}: {
  initialNames: DBBabyName[];
  initialSavedIds: string[];
}) {
  const [names, setNames] = useState<DBBabyName[]>(initialNames);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));
  const [genderFilter, setGenderFilter] = useState<"all" | "girl" | "boy" | "unisex">("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [savedOnly, setSavedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(VISIBLE_LIMIT);
  const [showStyleFilters, setShowStyleFilters] = useState(false);

  const [description, setDescription] = useState("");
  const [suggestGender, setSuggestGender] = useState<"all" | "girl" | "boy" | "unisex">("all");
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<NameSuggestion[] | null>(null);
  const [suggestIsFallback, setSuggestIsFallback] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // "Ask the companion" — looking up a name that isn't in the list yet, and
  // optionally adding it to the shared dataset for next time.
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<NameLookupSuggestion | null>(null);
  const [lookupGender, setLookupGender] = useState<"girl" | "boy" | "unisex">("unisex");
  const [saveToShortlist, setSaveToShortlist] = useState(true);
  const [addLoading, setAddLoading] = useState(false);

  const origins = useMemo(() => Array.from(new Set(names.map((n) => n.origin))).sort(), [names]);

  async function toggleSave(babyNameId: string) {
    const wasSaved = savedIds.has(babyNameId);
    const next = new Set(savedIds);
    if (wasSaved) next.delete(babyNameId);
    else next.add(babyNameId);
    setSavedIds(next);

    await fetch("/api/baby-names/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ babyNameId, saved: !wasSaved }),
    });
  }

  function toggleTag(tag: string) {
    const next = new Set(activeTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setActiveTags(next);
    setVisibleLimit(VISIBLE_LIMIT);
  }

  const preLetterMatches = useMemo(() => {
    return names.filter((n) => {
      // unisex names show up under every specific gender filter, not just "unisex"
      if (genderFilter !== "all" && n.gender !== genderFilter && n.gender !== "unisex") return false;
      if (originFilter !== "all" && n.origin !== originFilter) return false;
      if (savedOnly && !savedIds.has(n.id)) return false;
      if (activeTags.size > 0 && !n.style_tags.some((t) => activeTags.has(t))) return false;
      if (search.trim() && !n.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [names, genderFilter, originFilter, savedOnly, activeTags, search, savedIds]);

  const availableLetters = useMemo(() => {
    return new Set(preLetterMatches.map((n) => n.name.charAt(0).toUpperCase()));
  }, [preLetterMatches]);

  const filtered = useMemo(() => {
    const matches = letterFilter
      ? preLetterMatches.filter((n) => n.name.charAt(0).toUpperCase() === letterFilter)
      : preLetterMatches;
    return sortNames(matches, sortBy);
  }, [preLetterMatches, letterFilter, sortBy]);

  const visible = filtered.slice(0, visibleLimit);
  const hiddenCount = filtered.length - visibleLimit;

  function selectLetter(letter: string) {
    setLetterFilter((prev) => (prev === letter ? null : letter));
    setVisibleLimit(VISIBLE_LIMIT);
  }

  type RenderItem = { type: "header"; letter: string } | { type: "card"; name: DBBabyName };
  const renderItems = useMemo<RenderItem[]>(() => {
    if (letterFilter || (sortBy !== "name-asc" && sortBy !== "name-desc")) {
      return visible.map((n) => ({ type: "card", name: n }));
    }
    const items: RenderItem[] = [];
    let lastLetter: string | null = null;
    for (const n of visible) {
      const letter = n.name.charAt(0).toUpperCase();
      if (letter !== lastLetter) {
        items.push({ type: "header", letter });
        lastLetter = letter;
      }
      items.push({ type: "card", name: n });
    }
    return items;
  }, [visible, sortBy, letterFilter]);

  async function handleSuggest() {
    if (!description.trim()) return;
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestions(null);

    try {
      const res = await fetch("/api/baby-names/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          gender: suggestGender === "all" ? undefined : suggestGender,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSuggestError(data.error ?? "Something went wrong.");
        return;
      }
      setSuggestions(data.suggestions ?? []);
      setSuggestIsFallback(!!data.isFallback);
    } catch {
      setSuggestError("Couldn't get suggestions right now — try again shortly.");
    } finally {
      setSuggestLoading(false);
    }
  }

  async function handleLookup() {
    const term = search.trim();
    if (!term) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await fetch("/api/baby-names/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: term }),
      });
      const data = await res.json();

      if (data.type === "existing" && data.matches?.length > 0) {
        // Already in the dataset (just not matching current filters) —
        // clear other filters so it actually shows up in the grid.
        setNames((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const toAdd = (data.matches as DBBabyName[]).filter((m) => !existingIds.has(m.id));
          return [...prev, ...toAdd];
        });
        setGenderFilter("all");
        setOriginFilter("all");
        setActiveTags(new Set());
        setSavedOnly(false);
        setLetterFilter(null);
        return;
      }

      if (data.type === "ai_suggested" && data.suggestion) {
        setLookupResult(data.suggestion);
        setLookupGender(data.suggestion.gender);
        return;
      }

      setLookupError(data.error ?? "Couldn't find anything for that name.");
    } catch {
      setLookupError("Couldn't reach the companion right now — try again shortly.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleAddLookupResult() {
    if (!lookupResult) return;
    setAddLoading(true);
    try {
      const res = await fetch("/api/baby-names/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lookupResult.name,
          gender: lookupGender,
          origin: lookupResult.origin,
          meaning: lookupResult.meaning,
          styleTags: lookupResult.styleTags,
          saveToShortlist,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error ?? "Could not save that name.");
        return;
      }
      setNames((prev) => [...prev, data.name]);
      if (saveToShortlist) {
        setSavedIds((prev) => new Set(prev).add(data.name.id));
      }
      setLookupResult(null);
    } catch {
      setLookupError("Could not save that name — try again shortly.");
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* AI-assisted suggestions */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 bg-baby-lavender/60 px-5 py-3">
          <Sparkles className="h-4 w-4 text-baby-lavender-foreground" />
          <p className="font-display text-base font-semibold text-baby-lavender-foreground">
            Describe what you&apos;re looking for
          </p>
        </div>
        <CardContent className="flex flex-col gap-3 pt-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={'e.g. "something short, means light, works in both English and Hindi"'}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-ui text-xs text-muted-foreground">For:</span>
            {(["all", "girl", "boy", "unisex"] as const).map((g) => (
              <TagChip key={g} active={suggestGender === g} onClick={() => setSuggestGender(g)}>
                {g === "all" ? "Any" : GENDER_LABELS[g]}
              </TagChip>
            ))}
            <Button size="sm" onClick={handleSuggest} disabled={suggestLoading || !description.trim()} className="ml-auto">
              {suggestLoading ? "Thinking..." : "Get suggestions"}
            </Button>
          </div>
          {suggestError && <p className="text-sm text-destructive">{suggestError}</p>}
          {suggestions && suggestions.length > 0 && (
            <div className="flex flex-col gap-2">
              {suggestIsFallback && (
                <p className="text-xs italic text-muted-foreground">
                  Showing close matches from the names list (AI phrasing isn&apos;t available right now).
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {suggestions.map((s) => (
                  <NameCard
                    key={s.id}
                    name={{ id: s.id, name: s.name, gender: s.gender as DBBabyName["gender"], origin: s.origin, meaning: s.meaning, style_tags: s.styleTags }}
                    saved={savedIds.has(s.id)}
                    onToggleSave={() => toggleSave(s.id)}
                    whyItFits={s.why}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consolidated browse/filter toolbar */}
      <Card>
        <CardHeader>
          <CardTitle>Browse names</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleLimit(VISIBLE_LIMIT);
              }}
              placeholder="Search by name..."
              className="h-9 min-w-[140px] flex-1 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value as typeof genderFilter);
                setVisibleLimit(VISIBLE_LIMIT);
              }}
              className={selectClass}
            >
              <option value="all">All genders</option>
              <option value="girl">Girl</option>
              <option value="boy">Boy</option>
              <option value="unisex">Unisex</option>
            </select>
            <select
              value={originFilter}
              onChange={(e) => {
                setOriginFilter(e.target.value);
                setVisibleLimit(VISIBLE_LIMIT);
              }}
              className={selectClass}
            >
              <option value="all">All origins</option>
              {origins.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setVisibleLimit(VISIBLE_LIMIT);
              }}
              className={selectClass}
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
            <TagChip active={savedOnly} onClick={() => setSavedOnly((v) => !v)}>
              <span className="flex items-center gap-1">
                <Heart className={cn("h-3 w-3", savedOnly && "fill-current")} /> Saved
              </span>
            </TagChip>
            <button
              type="button"
              onClick={() => setShowStyleFilters((v) => !v)}
              className="flex items-center gap-1 rounded-full border border-input px-2.5 py-1 font-ui text-[11px] font-medium transition-colors hover:bg-accent"
            >
              <SlidersHorizontal className="h-3 w-3" />
              Style
              {showStyleFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {showStyleFilters && (
            <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
              {BABY_NAME_STYLE_TAGS.map((tag) => (
                <TagChip key={tag} active={activeTags.has(tag)} onClick={() => toggleTag(tag)}>
                  {tag}
                </TagChip>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {filtered.length} name{filtered.length === 1 ? "" : "s"} match
          </p>
        </CardContent>
      </Card>

      {/* A-Z jump: click a letter to see only names starting with it. */}
      <div className="flex flex-wrap gap-1.5">
        <TagChip
          active={letterFilter === null}
          onClick={() => {
            setLetterFilter(null);
            setVisibleLimit(VISIBLE_LIMIT);
          }}
        >
          All
        </TagChip>
        {ALPHABET.map((letter) => {
          const hasMatches = availableLetters.has(letter);
          return (
            <button
              key={letter}
              type="button"
              disabled={!hasMatches}
              onClick={() => selectLetter(letter)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border font-ui text-[11px] font-medium transition-colors",
                letterFilter === letter
                  ? "border-primary bg-primary text-primary-foreground"
                  : hasMatches
                    ? "border-input hover:bg-accent"
                    : "cursor-not-allowed border-input/40 text-muted-foreground/40"
              )}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Results grid, or the "ask the companion" fallback when nothing matches */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Wand2 className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No names match {search.trim() ? <>&ldquo;{search.trim()}&rdquo;</> : "those filters"} yet.
            </p>
            {search.trim() && !lookupResult && (
              <Button size="sm" onClick={handleLookup} disabled={lookupLoading}>
                {lookupLoading ? "Asking the companion..." : `Ask the companion about "${search.trim()}"`}
              </Button>
            )}
            {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}

            {lookupResult && (
              <div className="mt-2 w-full max-w-sm rounded-lg border border-border bg-secondary/40 p-4 text-left">
                <p className="font-display text-base font-semibold">{lookupResult.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lookupResult.origin} — &ldquo;{lookupResult.meaning}&rdquo;
                </p>
                <p className="mt-2 text-xs italic text-muted-foreground">
                  This is the companion&apos;s best guess, not a verified source — check it fits before saving.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <label htmlFor="lookupGender" className="text-xs text-muted-foreground">
                    Gender
                  </label>
                  <select
                    id="lookupGender"
                    value={lookupGender}
                    onChange={(e) => setLookupGender(e.target.value as typeof lookupGender)}
                    className={selectClass}
                  >
                    <option value="girl">Girl</option>
                    <option value="boy">Boy</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
                <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={saveToShortlist}
                    onChange={(e) => setSaveToShortlist(e.target.checked)}
                  />
                  Also save to my shortlist
                </label>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={handleAddLookupResult} disabled={addLoading}>
                    {addLoading ? "Saving..." : "Add to Baby Names"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setLookupResult(null)}>
                    Cancel
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Saved names go into the shared list — anyone using this app will see it too.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {renderItems.map((item, i) =>
              item.type === "header" ? (
                <p
                  key={`header-${item.letter}-${i}`}
                  className="col-span-full mt-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground first:mt-0"
                >
                  {item.letter}
                </p>
              ) : (
                <NameCard
                  key={item.name.id}
                  name={item.name}
                  saved={savedIds.has(item.name.id)}
                  onToggleSave={() => toggleSave(item.name.id)}
                />
              )
            )}
          </div>
          {hiddenCount > 0 && (
            <Button
              variant="outline"
              onClick={() => setVisibleLimit((v) => v + VISIBLE_LIMIT)}
              className="mx-auto gap-1.5"
            >
              Show {Math.min(hiddenCount, VISIBLE_LIMIT)} more
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          {visibleLimit > VISIBLE_LIMIT && hiddenCount <= 0 && (
            <Button
              variant="ghost"
              onClick={() => setVisibleLimit(VISIBLE_LIMIT)}
              className="mx-auto gap-1.5"
            >
              Show less
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
