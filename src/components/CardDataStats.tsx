import React, { ReactNode } from "react";
import clsx from "clsx";

interface CardDataStatsProps {
  title: string;
  total: string;
  rate?: string;
  levelUp?: boolean;
  levelDown?: boolean;
  children?: ReactNode;
  color?: string;
  loading?: boolean;
}

const CardDataStats: React.FC<CardDataStatsProps> = ({
  title,
  total,
  rate,
  levelUp,
  levelDown,
  children,
  color,
  loading
}) => {
  return (
    <div className={clsx(
      "relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-md dark:bg-slate-900/50 dark:ring-slate-800/50 dashboard-card-hover",
      color ? `border-l-4 border-${color}` : ""
    )}>
      {/* Subtle Background Glow entirely optional but adds premium feel */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl dark:bg-primary/10"></div>
      
      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-primary ring-1 ring-slate-100 dark:bg-slate-800 dark:text-primary dark:ring-slate-700/50">
              {children}
            </div>
            
            {(levelUp || levelDown || rate) && (
              <span
                className={clsx(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                  levelUp ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "",
                  levelDown ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" : "",
                  !levelUp && !levelDown && rate ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" : ""
                )}
              >
                {rate}
                {levelUp && (
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.35716 2.47737L0.908974 5.82987L5.0443e-07 4.94612L5 0.0848689L10 4.94612L9.09103 5.82987L5.64284 2.47737L5.64284 10.0849L4.35716 10.0849L4.35716 2.47737Z" />
                  </svg>
                )}
                {levelDown && (
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.64284 7.69237L9.09102 4.33987L10 5.22362L5 10.0849L-8.98488e-07 5.22362L0.908973 4.33987L4.35716 7.69237L4.35716 0.0848701L5.64284 0.0848704L5.64284 7.69237Z" />
                  </svg>
                )}
              </span>
            )}
          </div>

          <div>
            <h4 className={clsx("text-3xl font-bold tracking-tight", color ? `text-${color}` : "text-slate-900 dark:text-white")}>
              {typeof total === 'string' && total.includes(" AED") ? (
                <>
                  {total.replace(" AED", "")} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">AED</span>
                </>
              ) : (
                total
              )}
            </h4>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 block">
              {title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardDataStats;
