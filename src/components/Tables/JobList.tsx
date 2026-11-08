"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { FiBriefcase, FiChevronDown, FiLoader, FiLock, FiPlus, FiSearch, FiUnlock, FiX } from "react-icons/fi";
import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";
import EntitySearchPicker, { type PickedEntity } from "@/components/common/EntitySearchPicker";
import EntityAvatar from "@/components/common/EntityAvatar";

type JobRow = {
  id: string;
  jobId: string;
  title: string;
  description: string;
  status: "open" | "closed";
  client: { id: string; name: string; type: "company" | "employee" | "individual"; color?: string; companyName?: string } | null;
  totals: {
    totalIncome: number;
    totalExpense: number;
    totalServiceFee: number;
    net: number;
    transactionCount: number;
  };
};

const money = (value: number) =>
  Number(value || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300";

export default function JobList({
  entity,
  embedded = false,
}: {
  entity?: PickedEntity;
  embedded?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canView = hasPermission(permissions, "payments.view.transactions");
  const canCreate = hasPermission(permissions, "payments.create.transactions");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "open" | "closed">("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [client, setClient] = useState<PickedEntity | null>(entity || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !canView) router.push("/not-permitted");
  }, [user, canView, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["jobs", search, status, entity?.id],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (await axios.get("/api/jobs", { params: { q: search, status, page: pageParam, limit: 20, entityId: entity?.id } })).data,
    getNextPageParam: (lastPage, allPages) => (lastPage?.hasMore ? allPages.length : undefined),
    enabled: canView,
  });

  const jobs: JobRow[] = data?.pages.flatMap((p: any) => p?.jobs || []) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) {
      toast.error("Select a client for this job");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post("/api/jobs", { ...form, entity: client.id });
      toast.success("Job created");
      setModalOpen(false);
      setForm({ title: "", description: "" });
      setClient(entity || null);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      router.push(`/accounts/jobs/${res.data.data.id}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to create job");
    } finally {
      setSaving(false);
    }
  };

  if (!user || !canView) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {!embedded && (
      <section className="rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-5 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
              <FiBriefcase /> Job Tracking
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Jobs
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Jobs are created with an automatic ID and linked to a client. Link a transaction by choosing the Job ID in the record form.
            </p>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <FiPlus /> New Job
            </button>
          )}
        </div>
      </section>
      )}
      {embedded && canCreate && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
          >
            <FiPlus /> New Job
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by job ID, title, description or client"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | "open" | "closed");
          }}
          className={`${inputClass} sm:w-40`}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
            <tr>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Txns</th>
              <th className="px-4 py-3 text-right">Income</th>
              <th className="px-4 py-3 text-right">Expense</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading jobs...</td>
              </tr>
            )}
            {!isLoading && jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No jobs found.</td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr
                key={job.id}
                className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  job.status === "closed" ? "bg-slate-50/70 opacity-70 dark:bg-slate-800/30" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/accounts/jobs/${job.id}`}
                    className="font-bold text-cyan-700 hover:underline dark:text-cyan-400"
                  >
                    {job.jobId}
                  </Link>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{job.title}</p>
                  {job.description && <p className="line-clamp-1 text-xs text-slate-500">{job.description}</p>}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {job.client ? (
                    <Link
                      href={`/${job.client.type}/${job.client.id}`}
                      className="inline-flex items-center gap-2 hover:text-cyan-700"
                    >
                      <EntityAvatar name={job.client.name} color={job.client.color} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium hover:underline">{job.client.name}</span>
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {job.client.type === "employee" && job.client.companyName
                            ? `Employee — ${job.client.companyName}`
                            : job.client.type}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      job.status === "open"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-300 text-slate-700 ring-1 ring-inset ring-slate-400/40 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {job.status === "closed" ? <FiLock className="h-3 w-3" /> : <FiUnlock className="h-3 w-3" />}
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{job.totals.transactionCount}</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600">{money(job.totals.totalIncome)}</td>
                <td className="px-4 py-3 text-right font-semibold text-rose-600">{money(job.totals.totalExpense + (job.totals.totalServiceFee || 0))}</td>
                <td className={`px-4 py-3 text-right font-bold ${job.totals.totalExpense + (job.totals.totalServiceFee || 0) - job.totals.totalIncome > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {money(job.totals.totalExpense + (job.totals.totalServiceFee || 0) - job.totals.totalIncome)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-slate-500 dark:text-slate-400">Showing {jobs.length} jobs</p>
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {isFetching ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiChevronDown className="h-3.5 w-3.5" />}
            {isFetching ? "Loading..." : "Load More"}
          </button>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">New Job</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-800">
                <FiX />
              </button>
            </div>
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              The Job ID is generated automatically when you create the job.
            </p>
            <div>
              <label className={labelClass}>Client</label>
              {entity ? (
                <p className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold dark:border-slate-600 dark:text-slate-100">{entity.name}</p>
              ) : (
                <EntitySearchPicker value={client} onChange={setClient} />
              )}
            </div>
            <div>
              <label className={labelClass}>Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
                placeholder="Job title"
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
                placeholder="Optional details"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create Job"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
