"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiLock,
  FiUnlock,
  FiFileText,
} from "react-icons/fi";
import EntityAvatar from "@/components/common/EntityAvatar";
import { hasPermission } from "@/auth/permissions";
import { useUserContext } from "@/contexts/UserContext";
import EntitySearchPicker, { type PickedEntity } from "@/components/common/EntitySearchPicker";
import TransactionList from "@/components/Tables/TransactionList";

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

  const [isEditing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "open" });
  const [formClient, setFormClient] = useState<PickedEntity | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user && !canView) router.push("/not-permitted");
  }, [user, canView, router]);

  const { data: job, isLoading: jobLoading, error: jobError } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => (await axios.get(`/api/jobs/${id}`)).data,
    enabled: canView && Boolean(id),
    retry: false,
  });

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
      queryClient.invalidateQueries({ queryKey: ["payment"] });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update job");
    }
  };

  const convertToInvoice = async () => {
    setExporting(true);
    try {
      const { data } = await axios.get("/api/payment", {
        params: { jobIdExact: job.jobId, sort: "oldest", limit: 0 },
      });
      const all: JobRecord[] = data?.records || [];
      const items = all
        .filter((r) => r.type === "expense")
        .map((r: any) => ({
          title: r.particular || `Expense ${r.suffix || ""}${r.number || ""}`,
          desc: "",
          rate: Number((Number(r.amount || 0) + Number(r.serviceFee || 0)).toFixed(2)),
          quantity: 1,
        }));
      if (!items.length) {
        toast.error("This job has no expense transactions to invoice");
        return;
      }
      const advance = all
        .filter((r) => r.type === "income")
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

      const today = new Date();
      const validTo = new Date(today);
      validTo.setDate(validTo.getDate() + 30);
      const entityType = job.client?.type || null;

      sessionStorage.setItem(
        "zaad.invoice.prefill",
        JSON.stringify({
          connectionMode: entityType ? "connected" : "detached",
          selectedEntityType: entityType,
          selectedEntitySummary: job.client
            ? { id: job.client.id, name: job.client.name, type: job.client.type }
            : null,
          invoiceData: {
            quotation: "false",
            message: "",
            trn: "",
            createdBy: user?._id,
            client: job.client?.name || "Client",
            entityId: job.client?.id || null,
            entityType,
            date: today.toISOString().split("T")[0],
            validTo: validTo.toISOString().split("T")[0],
            items,
            remarks: `Generated from job ${job.jobId} - ${job.title}`,
            advance: Number(advance.toFixed(2)),
            location: "",
            purpose: job.title || "Job to Invoice",
            amount: 0,
            showBalance: "show",
            balance: 0,
          },
          createdAt: Date.now(),
        }),
      );
      const params = new URLSearchParams({
        prefill: "records",
        returnTo: `/accounts/jobs/${id}`,
      });
      router.push(`/accounts/invoice/new?${params.toString()}`);
    } catch {
      toast.error("Failed to prepare invoice from job");
    } finally {
      setExporting(false);
    }
  };

  const toggleStatus = async () => {
    const next = job.status === "closed" ? "open" : "closed";
    const message =
      next === "closed"
        ? `Close job ${job.jobId}? It will no longer appear in job suggestions.`
        : `Reopen job ${job.jobId}?`;
    if (!window.confirm(message)) return;
    try {
      await axios.put(`/api/jobs/${id}`, { status: next });
      toast.success(next === "closed" ? "Job closed" : "Job reopened");
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-suggestions"] });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update job status");
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
  // Drop empty buckets (e.g. zero-amount service-fee-only records with no method).
  Object.keys(methodTotals).forEach((key) => {
    if (!methodTotals[key].income && !methodTotals[key].expense) delete methodTotals[key];
  });

  const totalDue = t.totalExpense + t.totalServiceFee;
  const balance = totalDue - t.totalIncome;
  const isClosed = job.status === "closed";

  return (
    <>
      <section
        className={`overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-slate-900 ${
          isClosed ? "border-slate-200 dark:border-slate-700" : "border-cyan-200 dark:border-cyan-900/50"
        }`}
      >
        <div className={`h-1.5 w-full ${isClosed ? "bg-slate-300 dark:bg-slate-700" : "bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500"}`} />
        {isEditing ? (
          <form onSubmit={saveEdit} className="grid gap-3 p-4 sm:grid-cols-2">
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
          <div className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {job.jobId}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      isClosed
                        ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    }`}
                  >
                    {isClosed ? <FiLock className="h-3 w-3" /> : <FiUnlock className="h-3 w-3" />}
                    {job.status}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">{job.title}</h2>
                {job.description && (
                  <p className="mt-1 max-w-2xl whitespace-pre-line text-sm leading-5 text-slate-600 dark:text-slate-400">{job.description}</p>
                )}
                {job.client && (
                  <Link
                    href={`/${job.client.type}/${job.client.id}`}
                    className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-700"
                  >
                    <span className="scale-75 origin-left -mr-1.5">
                      <EntityAvatar name={job.client.name} color={job.client.color} size="sm" />
                    </span>
                    <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{job.client.name}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider">
                      {job.client.type === "employee" && job.client.companyName
                        ? `Employee — ${job.client.companyName}`
                        : job.client.type}
                    </span>
                  </Link>
                )}
              </div>

              <div className="flex flex-col gap-2 lg:items-end">
                <div className="flex flex-wrap gap-2">
                  {canCreate && (
                    <Link
                      href={`/accounts/add-record?type=income&jobId=${encodeURIComponent(job.jobId)}${job.client ? `&lockEntityId=${job.client.id}&lockEntityType=${job.client.type}&lockEntityName=${encodeURIComponent(job.client.name)}` : ""}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm hover:bg-cyan-700"
                    >
                      <FiPlus /> Add record
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={convertToInvoice}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
                  >
                    <FiFileText /> To Invoice
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canUpdate && (
                    <button type="button" onClick={startEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                      <FiEdit2 /> Edit
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={toggleStatus}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        isClosed
                          ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                          : "border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                      }`}
                    >
                      {isClosed ? (
                        <>
                          <FiUnlock /> Reopen job
                        </>
                      ) : (
                        <>
                          <FiLock /> Close job
                        </>
                      )}
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                      <FiTrash2 /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="flex items-center justify-between gap-2 rounded-xl border-l-4 border-emerald-500 bg-emerald-500/10 px-3.5 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Income</p>
                <p className="text-lg font-black tabular-nums text-emerald-600 dark:text-emerald-400">{money(t.totalIncome)}</p>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl border-l-4 border-rose-500 bg-rose-500/10 px-3.5 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Expense</p>
                <p className="text-lg font-black tabular-nums text-rose-600 dark:text-rose-400">{money(totalDue)}</p>
              </div>
              <div
                className={`flex items-center justify-between gap-2 rounded-xl border-l-4 px-3.5 py-2.5 ${
                  balance > 0 ? "border-amber-500 bg-amber-500/15" : "border-emerald-500 bg-emerald-500/10"
                }`}
              >
                <p className={`text-[11px] font-bold uppercase tracking-wider ${balance > 0 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}>Balance</p>
                <p className={`text-lg font-black tabular-nums ${balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>{money(balance)}</p>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl border-l-4 border-violet-500 bg-violet-500/10 px-3.5 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Transactions</p>
                <p className="text-lg font-black tabular-nums text-violet-600 dark:text-violet-400">{t.transactionCount}</p>
              </div>
            </div>
            {Object.keys(methodTotals).length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                {Object.entries(methodTotals).map(([method, v]) => (
                  <span key={method} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs dark:bg-slate-800/60">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{method}</span>
                    {v.income > 0 && <span className="font-bold text-emerald-600">+{money(v.income)}</span>}
                    {v.expense > 0 && <span className="font-bold text-rose-600">-{money(v.expense)}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="mt-4">
        <Suspense fallback={<div className="py-10 text-center text-sm text-slate-500">Loading transactions...</div>}>
          <TransactionList embedded enableSelection lockJobId={job.jobId} returnTo={`/accounts/jobs/${id}`} />
        </Suspense>
      </div>
    </>
  );
}
