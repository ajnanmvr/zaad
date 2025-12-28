import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              ref={ref}
              {...props}
            />
            <div
              className={cn(
                "h-5 w-5 rounded border-2 transition-all",
                error
                  ? "border-red"
                  : "border-stroke dark:border-strokedark peer-checked:bg-emerald-600 peer-checked:border-emerald-600",
                "peer-focus:ring-2 peer-focus:ring-emerald-500/20",
                "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                className
              )}
            />
            <Check className="absolute top-0.5 left-0.5 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
          </div>
          {label && (
            <span className="text-sm text-black dark:text-white select-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {label}
              {props.required && <span className="text-red ml-1">*</span>}
            </span>
          )}
        </label>
        {error && <p className="mt-1.5 text-sm text-red">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
