"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean;
  indicator?: React.ReactNode;
};

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked = false, className, indicator, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded border",
          checked ? "bg-foreground text-background" : "bg-background",
          className
        )}
        {...props}
      >
        {checked ? indicator ?? <span aria-hidden>✓</span> : null}
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
