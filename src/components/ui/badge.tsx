import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro",
  {
    variants: {
      variant: {
        default: "bg-inset text-muted",
        accent: "bg-accent-muted text-accent",
        outline: "border border-line text-muted",
        success: "bg-green-500/15 text-green-600 dark:text-green-400",
        warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        danger: "bg-red-500/15 text-red-600 dark:text-red-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
