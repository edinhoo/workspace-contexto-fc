import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary";
};

const badgeVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:
    "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]",
  secondary:
    "bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)]",
};

export const Badge = ({
  className,
  variant = "default",
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
      badgeVariants[variant],
      className,
    )}
    {...props}
  />
);
