"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiAward, FiCheck, FiCreditCard, FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";
import { JOB_CATEGORIES, type JobCategory } from "@/config/jobTitleSuggestions";

type Suggestion = { id: string; category: JobCategory; title: string };

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

export default function JobTitleSuggestionsPage() {
  const { user } = useUserContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const allowed = hasPermission(permissions, "settings.manage.job-titles");

  const [newTitles, setNewTitles] = useState<Record<JobCategory, string>>({ license: "", visa: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleting, setDeleting] = useState<Suggestion | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && !allowed) router.push("/not-permitted");
  }, [user, allowed, router]);

  const { data: suggestions = [], isLoading } = useQuery<Suggestion[]>({
    queryKey: ["job-title-suggestions"],
    queryFn: async () => (await axios.get("/api/job-titles")).data.suggestions,
    enabled: allowed,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["job-title-suggestions"] });
  const errorMessage = (error: any, fallback: string) => error?.response?.data?.error || fallback;

  const add = async (category: JobCategory) => {
    const title = newTitles[category].trim();
    if (!title) return;
    setBusy(true);
    try {
      await axios.post("/api/job-titles", { category, title });
      setNewTitles((prev) => ({ ...prev, [category]: "" }));
      refresh();
    } catch (error: any) {
      toast.error(errorMessage(error, "Failed to add suggestion"));
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (item: Suggestion) => {
    setBusy(true);
    try {
      await axios.put(`/api/job-titles/${item.id}`, { category: item.category, title: editTitle });
      setEditingId(null);
      refresh();
    } catch (error: any) {
      toast.error(errorMessage(error, "Failed to update suggestion"));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await axios.delete(`/api/job-titles/${deleting.id}`);
      toast.success("Suggestion deleted");
      setDeleting(null);
      refresh();
    } catch (error: any) {
      toast.error(errorMessage(error, "Failed to delete suggestion"));
    } finally {
      setBusy(false);
    }
  };

  if (!user || !allowed) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  const icons: Record<JobCategory, React.ReactNode> = { license: <FiAward />, visa: <FiCreditCard /> };

  return (
    <>
      <Breadcrumb pageName="Job Title Suggestions" />

      <ConfirmationModal
        isOpen={Boolean(deleting)}
        title="Delete suggestion"
        message={`Delete "${deleting?.title}"? Existing jobs are not affected.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />

      <p className="mb-3 text-sm text-slate-500">
        These titles are suggested when creating a job. License jobs get the <b>TL</b> code and visa jobs the <b>VS</b>{" "}
        code in the Job ID.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {JOB_CATEGORIES.map((category) => {
          const items = suggestions.filter((item) => item.category === category.value);
          return (
            <section
              key={category.value}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-slate-100">
                  <span className="text-cyan-600">{icons[category.value]}</span>
                  {category.label}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                    {category.code}
                  </span>
                </h2>
                <span className="text-xs text-slate-500">{items.length} suggestions</span>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  add(category.value);
                }}
                className="mt-3 flex gap-2"
              >
                <input
                  value={newTitles[category.value]}
                  onChange={(e) => setNewTitles((prev) => ({ ...prev, [category.value]: e.target.value }))}
                  className={inputClass}
                  placeholder={`Add a ${category.label.toLowerCase()} suggestion`}
                />
                <button
                  type="submit"
                  disabled={busy || !newTitles[category.value].trim()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
                >
                  <FiPlus /> Add
                </button>
              </form>

              <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {isLoading && <li className="px-3 py-6 text-center text-sm text-slate-500">Loading...</li>}
                {!isLoading && items.length === 0 && (
                  <li className="px-3 py-6 text-center text-sm text-slate-500">No suggestions yet.</li>
                )}
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    {editingId === item.id ? (
                      <>
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(item);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className={inputClass}
                        />
                        <button type="button" disabled={busy} onClick={() => saveEdit(item)} title="Save" className="rounded-lg border border-emerald-300 p-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300">
                          <FiCheck className="text-sm" />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} title="Cancel" className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
                          <FiX className="text-sm" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">{item.title}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditTitle(item.title);
                          }}
                          title="Edit"
                          className="rounded-lg border border-blue-300 p-1.5 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button type="button" onClick={() => setDeleting(item)} title="Delete" className="rounded-lg border border-rose-300 p-1.5 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
