import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "twp:inline-flex twp:items-center twp:justify-center twp:gap-2 twp:whitespace-nowrap twp:rounded-md twp:text-sm twp:font-medium twp:transition-all twp:disabled:pointer-events-none twp:disabled:opacity-50 twp:[&_svg]:pointer-events-none twp:[&_svg:not([class*=size-])]:size-4 twp:shrink-0 twp:[&_svg]:shrink-0 twp:outline-none twp:focus-visible:border-ring twp:focus-visible:ring-ring/50 twp:focus-visible:ring-[3px] twp:aria-invalid:ring-destructive/20 twp:dark:aria-invalid:ring-destructive/40 twp:aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "twp:bg-primary twp:text-primary-foreground twp:hover:bg-primary/90",
        destructive:
          "twp:bg-destructive twp:text-white twp:hover:bg-destructive/90 twp:focus-visible:ring-destructive/20 twp:dark:focus-visible:ring-destructive/40 twp:dark:bg-destructive/60",
        outline:
          "twp:border twp:bg-background twp:shadow-xs twp:hover:bg-accent twp:hover:text-accent-foreground twp:dark:bg-input/30 twp:dark:border-input twp:dark:hover:bg-input/50",
        secondary:
          "twp:bg-secondary twp:text-secondary-foreground twp:hover:bg-secondary/80",
        ghost:
          "twp:hover:bg-accent twp:hover:text-accent-foreground twp:dark:hover:bg-accent/50",
        link: "twp:text-primary twp:underline-offset-4 twp:hover:underline",
      },
      size: {
        default: "twp:h-9 twp:px-4 twp:py-2 twp:has-[>svg]:px-3",
        xs: "twp:h-6 twp:gap-1 twp:rounded-md twp:px-2 twp:text-xs twp:has-[>svg]:px-1.5 twp:[&_svg:not([class*=size-])]:size-3",
        sm: "twp:h-8 twp:rounded-md twp:gap-1.5 twp:px-3 twp:has-[>svg]:px-2.5",
        lg: "twp:h-10 twp:rounded-md twp:px-6 twp:has-[>svg]:px-4",
        icon: "twp:size-9",
        "icon-xs": "twp:size-6 twp:rounded-md twp:[&_svg:not([class*=size-])]:size-3",
        "icon-sm": "twp:size-8",
        "icon-lg": "twp:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
