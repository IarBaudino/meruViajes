import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-brand-ice px-3 py-0.5 text-xs font-medium text-brand-primary",
        className
      )}
      {...props}
    />
  );
}
