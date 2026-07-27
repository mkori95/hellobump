import { BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BOOK_RECOMMENDATIONS, fulcoLibraryUrl } from "@/lib/content/book-recommendations";

export function BookRecommendationsCard() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-lavender/60 px-5 py-3">
        <BookOpen className="h-4 w-4 text-baby-lavender-foreground" />
        <p className="font-display text-base font-semibold text-baby-lavender-foreground">Books worth a read</p>
      </div>
      <CardContent className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
        {BOOK_RECOMMENDATIONS.map((book) => (
          <a
            key={book.title}
            href={fulcoLibraryUrl(book.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{book.title}</p>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">{book.author}</p>
            <p className="mt-1 text-xs text-muted-foreground">{book.blurb}</p>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
