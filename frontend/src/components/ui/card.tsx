import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps): JSX.Element {
  return <div className={cn("rounded-xl border border-user-border bg-user-surface p-4", className)} {...props} />;
}
