import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioCardProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// A plain <input type="radio"> styled as a selectable card — avoids pulling
// in a Radix radio-group primitive for something this simple.
const RadioCard = React.forwardRef<HTMLInputElement, RadioCardProps>(
  ({ className, label, checked, ...props }, ref) => (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md border border-input px-4 py-3 text-sm transition-colors hover:bg-accent",
        checked && "border-primary bg-accent",
        className
      )}
    >
      <input
        ref={ref}
        type="radio"
        checked={checked}
        className="h-4 w-4 accent-primary"
        {...props}
      />
      {label}
    </label>
  )
);
RadioCard.displayName = "RadioCard";

export { RadioCard };
