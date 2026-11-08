"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { FiAward, FiCreditCard, FiRotateCcw } from "react-icons/fi";

import {
  JOB_CATEGORIES,
  JOB_CATEGORY_CODES,
  type JobCategory,
} from "@/config/jobTitleSuggestions";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300";

const MAX_SUGGESTIONS = 5;

const categoryIcon: Record<JobCategory, React.ReactNode> = {
  license: <FiAward />,
  visa: <FiCreditCard />,
};

// Job type (License / Visa), the Job ID (auto-suggested, editable) and a title input whose
// suggestions drop down as you type. Picking a suggestion also sets the job type.
export default function JobCategoryTitleFields({
  category,
  onCategoryChange,
  title,
  onTitleChange,
  jobId,
  onJobIdChange,
  autoFocusTitle = false,
}: {
  category: JobCategory | "";
  onCategoryChange: (category: JobCategory) => void;
  title: string;
  onTitleChange: (title: string) => void;
  /** Custom Job ID typed by the user; empty means "use the generated one". */
  jobId: string;
  onJobIdChange: (jobId: string) => void;
  autoFocusTitle?: boolean;
}) {
  const [titleFocused, setTitleFocused] = useState(false);

  // Managed in Settings > Job Title Suggestions; the built-in list is the fallback.
  const { data: stored } = useQuery<Array<{ category: JobCategory; title: string }>>({
    queryKey: ["job-title-suggestions-picker"],
    queryFn: async () => (await axios.get("/api/job-titles")).data.suggestions,
    staleTime: 5 * 60 * 1000,
  });

  const { data: nextId } = useQuery<string>({
    queryKey: ["job-next-id", category],
    queryFn: async () => (await axios.get("/api/jobs/next-id", { params: { category } })).data.jobId,
    enabled: Boolean(category),
    staleTime: 0,
  });

  const allSuggestions = useMemo(() => {
    const byCategory: Record<JobCategory, string[]> = {
      license: (stored ?? []).filter((item) => item.category === "license").map((item) => item.title),
      visa: (stored ?? []).filter((item) => item.category === "visa").map((item) => item.title),
    };
    return (Object.keys(byCategory) as JobCategory[]).flatMap((cat) =>
      byCategory[cat].map((item) => ({ category: cat, title: item })),
    );
  }, [stored]);

  // At most five suggestions. Typing searches both types; with nothing typed, show the chosen
  // type's titles, or a mix of both types when no type is chosen yet.
  const suggestions = useMemo(() => {
    const needle = title.trim().toLowerCase();
    if (needle) {
      return allSuggestions.filter((item) => item.title.toLowerCase().includes(needle)).slice(0, MAX_SUGGESTIONS);
    }
    if (category) {
      return allSuggestions.filter((item) => item.category === category).slice(0, MAX_SUGGESTIONS);
    }
    const license = allSuggestions.filter((item) => item.category === "license");
    const visa = allSuggestions.filter((item) => item.category === "visa");
    const mixed: typeof allSuggestions = [];
    for (let i = 0; mixed.length < MAX_SUGGESTIONS && (i < license.length || i < visa.length); i++) {
      if (license[i]) mixed.push(license[i]);
      if (mixed.length < MAX_SUGGESTIONS && visa[i]) mixed.push(visa[i]);
    }
    return mixed;
  }, [allSuggestions, title, category]);

  // Picking (or typing exactly) a known title sets the job type automatically.
  const applyTitle = (value: string) => {
    onTitleChange(value);
    const exact = allSuggestions.find((item) => item.title.toLowerCase() === value.trim().toLowerCase());
    if (exact && exact.category !== category) onCategoryChange(exact.category);
  };

  const showDropdown = titleFocused && suggestions.length > 0 && !suggestions.every((item) => item.title === title);
  const jobIdValue = jobId || nextId || "";

  return (
    <>
      <div>
        <label className={labelClass}>Title</label>
        <div className="relative">
          <input
            required
            value={title}
            onChange={(e) => applyTitle(e.target.value)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTimeout(() => setTitleFocused(false), 150)}
            className={inputClass}
            placeholder="Type to search suggestions, or enter a title"
            autoFocus={autoFocusTitle}
            autoComplete="off"
          />
          {showDropdown && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900">
              {suggestions.map((item) => (
                <li key={`${item.category}-${item.title}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      applyTitle(item.title);
                      setTitleFocused(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="min-w-0 truncate text-slate-800 dark:text-slate-100">{item.title}</span>
                    <span
                      className={clsx(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                        item.category === "visa"
                          ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
                      )}
                    >
                      {item.category === "visa" ? "Visa" : "License"} · {JOB_CATEGORY_CODES[item.category]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Job type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {JOB_CATEGORIES.map((item) => {
              const selected = category === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onCategoryChange(item.value)}
                  className={clsx(
                    "flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-sm font-bold transition",
                    selected
                      ? "border-transparent bg-cyan-600 text-white shadow"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200",
                  )}
                >
                  {categoryIcon[item.value]}
                  {item.label}
                  <span className={clsx("text-[10px] font-semibold", selected ? "text-white/80" : "text-slate-400")}>
                    {item.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Job ID
            </label>
            {jobId && (
              <button
                type="button"
                onClick={() => onJobIdChange("")}
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700"
              >
                <FiRotateCcw className="h-3 w-3" /> Use generated ID
              </button>
            )}
          </div>
          <input
            value={jobIdValue}
            onChange={(e) => onJobIdChange(e.target.value.toUpperCase())}
            disabled={!category && !jobId}
            className={clsx(inputClass, "font-mono tracking-wide")}
            placeholder="Pick a job type to generate the ID"
            autoComplete="off"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            {jobId
              ? "Custom Job ID. It must be unique."
              : "Generated automatically (ZD-year-TL/VS-number). Edit it to use your own ID."}
          </p>
        </div>

      </div>
    </>
  );
}
