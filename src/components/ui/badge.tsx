import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "twp:inline-flex twp:items-center twp:justify-center twp:rounded-full twp:border twp:border-transparent twp:px-2 twp:py-0.5 twp:text-xs twp:font-medium twp:w-fit twp:whitespace-nowrap twp:shrink-0 twp:[&>svg]:size-3 twp:gap-1 twp:[&>svg]:pointer-events-none twp:focus-visible:border-ring twp:focus-visible:ring-ring/50 twp:focus-visible:ring-[3px] twp:aria-invalid:ring-destructive/20 twp:dark:aria-invalid:ring-destructive/40 twp:aria-invalid:border-destructive twp:transition-[color,box-shadow] twp:overflow-hidden",
  {
    variants: {
      variant: {
        default: "twp:bg-primary twp:text-primary-foreground twp:[a&]:hover:bg-primary/90",
        secondary:
          "twp:bg-secondary twp:text-secondary-foreground twp:[a&]:hover:bg-secondary/90",
        destructive:
          "twp:bg-destructive twp:text-white twp:[a&]:hover:bg-destructive/90 twp:focus-visible:ring-destructive/20 twp:dark:focus-visible:ring-destructive/40 twp:dark:bg-destructive/60",
        outline:
          "twp:border-border twp:text-foreground twp:[a&]:hover:bg-accent twp:[a&]:hover:text-accent-foreground",
        ghost: "twp:[a&]:hover:bg-accent twp:[a&]:hover:text-accent-foreground",
        link: "twp:text-primary twp:underline-offset-4 twp:[a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
