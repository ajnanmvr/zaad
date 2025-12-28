import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const selectVariants = cva(
  "w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50 dark:bg-boxdark appearance-none cursor-pointer",
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

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string | number; label: string }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, label, error, helperText, options, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-black dark:text-white">
            {label}
            {props.required && <span className="text-red ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(selectVariants({ variant: error ? "error" : variant, className }))}
            ref={ref}
            {...props}
          >
            {options ? (
              <>
                {!props.value && <option value="">Select...</option>}
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </>
            ) : (
              children
            )}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 dark:text-gray-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
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

Select.displayName = "Select";

export { Select };
