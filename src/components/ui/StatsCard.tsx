"use client";

import { Card, CardContent } from './Card';
import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  description?: string;
  loading?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
}

const variantStyles = {
  default: 'border-l-4 border-emerald-500',
  success: 'border-l-4 border-emerald-500',
  danger: 'border-l-4 border-red',
  warning: 'border-l-4 border-warning',
  info: 'border-l-4 border-meta-5',
};

const iconBgStyles = {
  default: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  danger: 'bg-red/10 text-red dark:bg-red/20',
  warning: 'bg-warning/10 text-warning dark:bg-warning/20',
  info: 'bg-meta-5/10 text-meta-5 dark:bg-meta-5/20',
};

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  description,
  loading = false,
  variant = 'default'
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className={cn('animate-pulse', variantStyles[variant])}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-lg', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-black dark:text-white">
                {value}
              </h3>
              {trend && (
                <div className={cn(
                  'flex items-center text-xs font-medium',
                  trend.isPositive !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-red'
                )}>
                  {trend.isPositive !== false ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : trend.isPositive === false ? (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  ) : (
                    <Minus className="h-3 w-3 mr-0.5" />
                  )}
                  {Math.abs(trend.value)}%
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {description}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              iconBgStyles[variant]
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
