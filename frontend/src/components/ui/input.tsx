import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps): JSX.Element {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-user-border bg-user-surface px-3 py-2 text-sm text-user-text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-user-primary",
        className
      )}
      {...props}
    />
  );
}
