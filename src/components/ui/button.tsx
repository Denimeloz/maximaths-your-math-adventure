import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-body",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-btn hover:shadow-btn-hover hover:translate-y-0.5 active:translate-y-1",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl",
        outline: "border-2 border-rainbow-purple bg-card text-foreground hover:bg-rainbow-purple/10 rounded-2xl",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl shadow-btn hover:shadow-btn-hover hover:translate-y-0.5",
        ghost: "hover:bg-muted hover:text-foreground rounded-2xl",
        link: "text-rainbow-purple underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground rounded-3xl shadow-[0_6px_0_hsl(35_100%_35%),0_8px_25px_hsl(45_100%_50%/0.4)] hover:shadow-[0_4px_0_hsl(35_100%_35%),0_6px_20px_hsl(45_100%_50%/0.5)] hover:translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_hsl(35_100%_35%),0_4px_15px_hsl(45_100%_50%/0.5)] animate-pulse-glow",
        orange: "bg-secondary text-secondary-foreground rounded-3xl shadow-[0_6px_0_hsl(25_100%_35%),0_8px_25px_hsl(32_100%_50%/0.4)] hover:shadow-[0_4px_0_hsl(25_100%_35%),0_6px_20px_hsl(32_100%_50%/0.5)] hover:translate-y-0.5 active:translate-y-1",
        pink: "bg-accent text-accent-foreground rounded-3xl shadow-[0_6px_0_hsl(330_80%_50%),0_8px_25px_hsl(330_100%_70%/0.4)] hover:shadow-[0_4px_0_hsl(330_80%_50%),0_6px_20px_hsl(330_100%_70%/0.5)] hover:translate-y-0.5 active:translate-y-1",
        nav: "bg-transparent text-foreground hover:bg-muted/50 rounded-full px-4",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4",
        lg: "h-14 rounded-3xl px-10 text-lg",
        xl: "h-16 rounded-3xl px-12 text-xl",
        icon: "h-11 w-11 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
