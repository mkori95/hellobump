import { Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SourceAttribution } from "@/components/SourceAttribution";
import type { NewsDigestResult } from "@/lib/content-pipeline";

export function NewsDigestCard({ digest }: { digest: NewsDigestResult | null }) {
  if (!digest || digest.items.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-blue/60 px-5 py-3">
        <Newspaper className="h-4 w-4 text-baby-blue-foreground" />
        <p className="font-display text-base font-semibold text-baby-blue-foreground">A few things worth knowing</p>
      </div>
      <CardContent className="flex flex-col gap-4 pt-4">
        {digest.items.map((item, i) => (
          <div key={i}>
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.summary}</p>
          </div>
        ))}
        <SourceAttribution sources={digest.sourcesUsed} />
      </CardContent>
    </Card>
  );
}
