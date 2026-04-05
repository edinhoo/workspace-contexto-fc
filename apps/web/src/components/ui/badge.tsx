import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--accent-foreground)]",
      className
    )}
    {...props}
  />
);
