import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        danger: 'bg-red/10 text-red dark:bg-red/20',
        warning: 'bg-warning/10 text-warning dark:bg-warning/20',
        info: 'bg-meta-5/10 text-meta-5 dark:bg-meta-5/20',
        secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        outline: 'border border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
