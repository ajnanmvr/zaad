"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";
import EntitySearchPicker, { type PickedEntity } from "@/components/common/EntitySearchPicker";
import { exportRowsCsv, exportRowsExcel, exportRowsPdf } from "@/utils/exportTableData";

type JobRecord = {
  id: string;
  type: "income" | "expense";
  particular: string;
  method: string;
  status: string;
  amount: string;
  serviceFee?: string;
  dateTime: string;
  createdAt: string;
  client?: { name?: string } | null;
};

const money = (value: number | string) =>
  Number(value || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canView = hasPermission(permissions, "payments.view.transactions");
  const canCreate = hasPermission(permissions, "payments.create.transactions");
  const canUpdate = hasPermission(permissions, "payments.update.transactions");
  const canDelete = hasPermission(permissions, "payments.delete.transactions");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "income" | "expense">("");
  const [page, setPage] = useState(0);
  const [isEditing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "open" });
  const [formClient, setFormClient] = useState<PickedEntity | null>(null);
  const [exporting, setExporting] = useState(false);
  const pageSize = 25;

  useEffect(() => {
    if (user && !canView) router.push("/not-permitted");
  }, [user, canView, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: job, isLoading: jobLoading, error: jobError } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => (await axios.get(`/api/jobs/${id}`)).data,
    enabled: canView && Boolean(id),
    retry: false,
  });

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ["job-records", job?.jobId, search, typeFilter, page],
    queryFn: async () =>
      (
        await axios.get("/api/payment", {
          params: {
            jobIdExact: job.jobId,
            q: search || undefined,
            t: typeFilter || undefined,
            page,
            limit: pageSize,
          },
        })
      ).data,
    enabled: Boolean(job?.jobId),
    placeholderData: keepPreviousData,
  });

  const records: JobRecord[] = recordsData?.records || [];

  const startEdit = () => {
    setFormClient(job.client ? { id: job.client.id, name: job.client.name, type: job.client.type } : null);
    setForm({
      title: job.title,
      description: job.description || "",
      status: job.status,
    });
    setEditing(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/jobs/${id}`, { ...form, entity: formClient?.id });
      toast.success("Job updated");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-records"] });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update job");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete job ${job.jobId}? Linked transactions are kept.`)) return;
    try {
      await axios.delete(`/api/jobs/${id}`);
      toast.success("Job deleted");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      router.push("/accounts/jobs");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to delete job");
    }
  };

  const downloadReport = async (format: "pdf" | "excel" | "csv") => {
    setExporting(true);
    try {
      const { data } = await axios.get("/api/payment", {
        params: { jobIdExact: job.jobId, sort: "oldest", limit: 0 },
      });
      const all: JobRecord[] = data?.records || [];
      if (all.length === 0) {
        toast.error("No transactions to export");
        return;
      }
      const rows = all.map((r) => ({
        Date: r.dateTime,
        Particular: r.particular,
        Client: r.client?.name || "",
        Method: r.method,
        Status: r.status,
        Type: r.type,
        Income: r.type === "income" ? Number(r.amount).toFixed(2) : "",
        Expense: r.type === "expense" ? Number(r.amount).toFixed(2) : "",
        "Service Fee": r.serviceFee ? Number(r.serviceFee).toFixed(2) : "",
      }));
      rows.push({
        Date: "",
        Particular: `TOTAL (${job.jobId} - ${job.title})`,
        Client: "",
        Method: "",
        Status: "",
        Type: `Net ${job.totals.net.toFixed(2)}`,
        Income: job.totals.totalIncome.toFixed(2),
        Expense: job.totals.totalExpense.toFixed(2),
        "Service Fee": job.totals.totalServiceFee.toFixed(2),
      });
      const prefix = `job-${job.jobId}`.replace(/[^\w-]+/g, "_");
      if (format === "pdf") await exportRowsPdf(rows, prefix);
      else if (format === "excel") exportRowsExcel(rows, prefix);
      else exportRowsCsv(rows, prefix);
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setExporting(false);
    }
  };

  if (!user || !canView || jobLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Job not found.</p>
        <Link href="/accounts/jobs" className="mt-3 inline-block text-cyan-600 hover:underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  const t = job.totals;
  const methodTotals: Record<string, { income: number; expense: number }> = {};
  (job.byMethod || []).forEach((row: { method: string; type: string; amount: number }) => {
    const entry = (methodTotals[row.method] ||= { income: 0, expense: 0 });
    if (row.type === "income") entry.income += row.amount;
    else entry.expense += row.amount;
  });

  return (
    <>
      <Link
        href="/accounts/jobs"
        className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-cyan-700 dark:text-slate-400"
      >
        <FiArrowLeft /> All jobs
      </Link>

      <section className="rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-5 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 sm:p-6">
        {isEditing ? (
          <form onSubmit={saveEdit} className="grid gap-3 sm:grid-cols-2">
            <EntitySearchPicker value={formClient} onChange={setFormClient} />
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Title" />
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} sm:col-span-2`} placeholder="Description" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600 dark:text-slate-200">Cancel</button>
              <button type="submit" className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">Save</button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                {job.jobId} · {job.status}
              </p>
              {job.client && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Client:{" "}
                  <Link href={`/${job.client.type}/${job.client.id}`} className="font-semibold text-cyan-700 hover:underline dark:text-cyan-400">
                    {job.client.name}
                  </Link>{" "}
                  <span className="text-xs uppercase text-slate-500">{job.client.type}</span>
                </p>
              )}
              <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{job.title}</h2>
              {job.description && (
                <p className="mt-1 max-w-2xl whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">{job.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {canCreate && (
                <Link
                  href={`/accounts/add-record?type=income&jobId=${encodeURIComponent(job.jobId)}${job.client ? `&lockEntityId=${job.client.id}&lockEntityType=${job.client.type}&lockEntityName=${encodeURIComponent(job.client.name)}` : ""}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-bold text-white hover:bg-cyan-700"
                >
                  <FiPlus /> Add record
                </Link>
              )}
              {canUpdate && (
                <button type="button" onClick={startEdit} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:text-slate-200">
                  <FiEdit2 /> Edit
                </button>
              )}
              {canDelete && (
                <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 rounded-xl border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-600">
                  <FiTrash2 /> Delete
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Income" value={money(t.totalIncome)} tone="text-emerald-600" />
        <StatCard label="Total Expense" value={money(t.totalExpense)} tone="text-rose-600" />
        <StatCard label="Net" value={money(t.net)} tone={t.net >= 0 ? "text-emerald-600" : "text-rose-600"} />
        <StatCard label="Service Fees" value={money(t.totalServiceFee)} tone="text-cyan-600" />
        <StatCard label="Transactions" value={String(t.transactionCount)} tone="text-slate-900 dark:text-slate-100" />
      </div>

      {Object.keys(methodTotals).length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">By payment method</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(methodTotals).map(([method, v]) => (
              <div key={method} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{method}</span>
                <span>
                  <span className="text-emerald-600">+{money(v.income)}</span>{" "}
                  <span className="text-rose-600">-{money(v.expense)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search transactions in this job"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as "" | "income" | "expense");
            setPage(0);
          }}
          className={`${inputClass} lg:w-40`}
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <div className="flex gap-2">
          {(["pdf", "excel", "csv"] as const).map((f) => (
            <button
              key={f}
              type="button"
              disabled={exporting}
              onClick={() => downloadReport(f)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold uppercase hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiDownload /> {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Particular</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recordsLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">Loading transactions...</td>
              </tr>
            )}
            {!recordsLoading && records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No transactions linked to this job yet. Enter Job ID {job.jobId} when creating a record.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">{r.dateTime}</td>
                <td className="px-4 py-3">
                  <Link href={`/accounts/transactions/details/${r.id}`} className="font-semibold text-slate-900 hover:text-cyan-700 hover:underline dark:text-slate-100">
                    {r.particular}
                  </Link>
                  {r.status && <p className="text-xs text-slate-500">{r.status}</p>}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.client?.name || "-"}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.method || "-"}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-bold ${r.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                  {r.type === "income" ? "+" : "-"}
                  {money(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40 dark:border-slate-600">
          <FiChevronLeft />
        </button>
        <span className="text-sm text-slate-600 dark:text-slate-400">Page {page + 1}</span>
        <button type="button" disabled={!recordsData?.hasMore} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40 dark:border-slate-600">
          <FiChevronRight />
        </button>
      </div>
    </>
  );
}
