"use client";

import { FormEvent, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import clsx from "clsx";
import { FiAlertCircle, FiPlus, FiTrash2 } from "react-icons/fi";

type ManagerType = "document" | "credential";

type ItemOption = {
  id: string;
  name?: string;
  platform?: string;
  createdAt?: string;
  usageCount?: number;
};

type TypePlatformManagerProps = {
  type: ManagerType;
  title: string;
  subtitle: string;
  addButtonLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  usageLabel: string;
  accent: "emerald" | "blue";
};

function TypePlatformManager({
  type,
  title,
  subtitle,
  addButtonLabel,
  inputLabel,
  inputPlaceholder,
  usageLabel,
  accent,
}: TypePlatformManagerProps) {
  const queryClient = useQueryClient();

  const [value, setValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const queryKey = [type === "document" ? "document-types" : "credential-platforms"];

  const { data: items = [], isLoading } = useQuery<ItemOption[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", { params: { type } });
      return (data?.options || []) as ItemOption[];
    },
  });

  const accentClasses =
    accent === "emerald"
      ? {
          button: "bg-emerald-600 hover:bg-emerald-700",
          focus: "focus:border-emerald-500 focus:ring-emerald-500/20",
          badge: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
          icon: "text-emerald-500",
        }
      : {
          button: "bg-blue-600 hover:bg-blue-700",
          focus: "focus:border-blue-500 focus:ring-blue-500/20",
          badge: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
          icon: "text-blue-500",
        };

  const itemName = (item: ItemOption) =>
    type === "document" ? item.name || "Untitled" : item.platform || "Untitled";

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();

    if (!value.trim()) {
      toast.error(`Please enter ${inputLabel.toLowerCase()}`);
      return;
    }

    setIsAdding(true);
    try {
      await axios.post("/api/templates", {
        type,
        ...(type === "document" ? { name: value.trim() } : { platform: value.trim() }),
      });

      toast.success(`${title.slice(0, -1)} added successfully`);
      setValue("");
      setShowAddForm(false);
      await queryClient.invalidateQueries({ queryKey });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(message || `Failed to add ${title.slice(0, -1).toLowerCase()}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete this ${title.slice(0, -1).toLowerCase()}?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await axios.delete("/api/templates", {
        params: { id, type },
      });
      toast.success(`${title.slice(0, -1)} deleted successfully`);
      await queryClient.invalidateQueries({ queryKey });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(message || `Failed to delete ${title.slice(0, -1).toLowerCase()}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition",
            accentClasses.button
          )}
        >
          <FiPlus />
          {addButtonLabel}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {inputLabel}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={inputPlaceholder}
              className={clsx(
                "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
                accentClasses.focus
              )}
            />
            <button
              type="submit"
              disabled={isAdding}
              className={clsx(
                "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
                accentClasses.button
              )}
            >
              {isAdding ? "Adding..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-800/40">
          <FiAlertCircle className="mx-auto mb-2 text-2xl text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No items yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{itemName(item)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.createdAt ? `Created: ${new Date(item.createdAt).toLocaleDateString()}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={clsx("inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset", accentClasses.badge)}>
                  {item.usageCount || 0} {usageLabel}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:bg-slate-700"
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TypePlatformManager;
