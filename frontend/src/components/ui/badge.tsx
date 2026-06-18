import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border border-user-border bg-user-surface px-2 py-1 text-xs font-medium text-user-text-primary",
        className
      )}
      {...props}
    />
  );
}
