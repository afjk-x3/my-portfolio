import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-elevated px-3 py-1 font-mono text-xs tracking-tight text-muted",
        className,
      )}
      {...props}
    />
  );
}
