import { SOURCE_LABELS, type SourceName } from "@/lib/content-sources";

export function SourceAttribution({ sources }: { sources: SourceName[] }) {
  if (sources.length === 0) return null;

  const names = sources.map((s) => SOURCE_LABELS[s]);
  const label =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;

  return <p className="text-xs text-muted-foreground">Sourced from {label}</p>;
}
