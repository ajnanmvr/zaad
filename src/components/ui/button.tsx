import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 border-transparent dark:from-brand-600 dark:to-brand-500",
                destructive:
                    "bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600 hover:shadow-red-500/40 dark:bg-red-900 dark:hover:bg-red-800",
                outline:
                    "border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
                secondary:
                    "bg-brand-50 text-brand-900 hover:bg-brand-100 border-transparent dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/30",
                ghost: "hover:bg-slate-100 hover:text-slate-900 border-transparent dark:hover:bg-slate-800 dark:hover:text-slate-50",
                link: "text-brand-900 underline-offset-4 hover:underline border-transparent dark:text-brand-400",
            },
            size: {
                default: "h-10 px-5 py-2",
                sm: "h-9 rounded-lg px-3",
                lg: "h-11 rounded-xl px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
