import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const textareaVariants = cva(
  "w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50 dark:bg-boxdark resize-y min-h-[100px]",
  {
    variants: {
      variant: {
        default: "border-stroke focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-strokedark dark:focus:border-emerald-500",
        error: "border-red focus:border-red focus:ring-2 focus:ring-red/20 dark:border-red",
        success: "border-emerald-600 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-emerald-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-black dark:text-white">
            {label}
            {props.required && <span className="text-red ml-1">*</span>}
          </label>
        )}
        <textarea
          className={cn(textareaVariants({ variant: error ? "error" : variant, className }))}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
