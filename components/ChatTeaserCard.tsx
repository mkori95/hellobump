import Link from "next/link";
import { MessageCircleHeart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DBChatMessage } from "@/lib/supabase";

export function ChatTeaserCard({ lastMessage }: { lastMessage: DBChatMessage | null }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 bg-baby-lavender/60 px-5 py-3">
        <MessageCircleHeart className="h-4 w-4 text-baby-lavender-foreground" />
        <p className="font-display text-base font-semibold text-baby-lavender-foreground">Your companion</p>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {lastMessage ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {lastMessage.role === "user" ? "You: " : ""}
            {lastMessage.content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Have a question, or just want to talk? Your companion is here anytime.
          </p>
        )}
        <Link
          href="/companion"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-auto self-start")}
        >
          {lastMessage ? "Continue chat" : "Say hello"}
        </Link>
      </CardContent>
    </Card>
  );
}
