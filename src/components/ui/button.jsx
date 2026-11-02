import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-tight transition-all duration-300 ease-swift active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "shine bg-gradient-brand bg-[length:200%_200%] bg-left text-primary-foreground shadow-glow hover:bg-right hover:shadow-glow-lg",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-destructive/30 hover:brightness-110 hover:shadow-lg hover:shadow-destructive/30",
        outline:
          "border border-border bg-card/50 backdrop-blur-sm text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-glow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:shadow-panel",
        ghost: "text-muted-foreground hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
