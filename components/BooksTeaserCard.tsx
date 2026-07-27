import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BOOK_RECOMMENDATIONS, fulcoLibraryUrl } from "@/lib/content/book-recommendations";

export function BooksTeaserCard() {
  const books = BOOK_RECOMMENDATIONS.slice(0, 4);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-lavender/60 px-5 py-3">
        <BookOpen className="h-4 w-4 text-baby-lavender-foreground" />
        <p className="font-display text-base font-semibold text-baby-lavender-foreground">Books worth a read</p>
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 pt-4">
        <ul className="flex flex-col gap-2 text-sm">
          {books.map((book) => (
            <li key={book.title}>
              <a
                href={fulcoLibraryUrl(book.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {book.title}
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
