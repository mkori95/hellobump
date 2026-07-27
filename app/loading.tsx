import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <LoadingSpinner size={96} />
      <p className="text-sm text-muted-foreground">Just a moment...</p>
    </div>
  );
}
