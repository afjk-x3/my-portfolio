import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Strike wipe: `before:` is a skewed band parked off the left edge. On hover it
 * slashes across to the right, like a stick cutting through. `isolate` plus
 * `before:-z-10` paints the band above the button's own background but below
 * its label and icon. The global reduced-motion rule shortens the transition to
 * near zero, so the slash is simply skipped there.
 */
const strikeWipe =
  "relative isolate overflow-hidden before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:-z-10 before:w-1/2 before:-translate-x-[150%] before:-skew-x-[30deg] before:transition-transform before:duration-500 before:ease-out hover:before:translate-x-[250%]";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight transition-[color,background-color,border-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: `${strikeWipe} bg-accent text-accent-ink before:bg-white/45 hover:bg-accent-soft hover:shadow-[0_0_32px_-6px_var(--color-accent)]`,
        outline: `${strikeWipe} border border-line-strong bg-transparent text-fg before:bg-accent/15 hover:border-accent hover:text-accent hover:shadow-[0_0_32px_-10px_var(--color-accent)]`,
        ghost: "text-muted hover:text-fg",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a <button> — use for <a> links. */
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { buttonVariants };
