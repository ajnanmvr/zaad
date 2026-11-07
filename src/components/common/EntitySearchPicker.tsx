"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FiSearch, FiX } from "react-icons/fi";

export type PickedEntity = {
  id: string;
  name: string;
  type: "company" | "employee" | "individual";
};

const TYPES = ["company", "employee", "individual"] as const;

/** Search-as-you-type picker across companies, employees and individuals. */
export default function EntitySearchPicker({
  value,
  onChange,
  placeholder = "Search company, employee or individual...",
}: {
  value: PickedEntity | null;
  onChange: (entity: PickedEntity | null) => void;
  placeholder?: string;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PickedEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = term.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const responses = await Promise.all(
          TYPES.map((type) =>
            axios
              .get<{ _id: string; name: string }[]>(`/api/${type}/search/${encodeURIComponent(q)}`)
              .then((res) => (res.data || []).map((e) => ({ id: e._id, name: e.name, type })))
              .catch(() => [] as PickedEntity[]),
          ),
        );
        if (!cancelled) setResults(responses.flat());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
        <span>
          <span className="font-semibold">{value.name}</span>{" "}
          <span className="text-xs uppercase text-slate-500">{value.type}</span>
        </span>
        <button type="button" onClick={() => onChange(null)} className="text-slate-500 hover:text-slate-800">
          <FiX />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
      {open && term.trim() && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900">
          {loading && <li className="px-3 py-2 text-sm text-slate-500">Searching...</li>}
          {!loading && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
          )}
          {results.map((entity) => (
            <li key={`${entity.type}-${entity.id}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(entity);
                  setTerm("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{entity.name}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {entity.type}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
