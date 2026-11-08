"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheck, FiCreditCard, FiEdit2, FiRotateCcw, FiX } from "react-icons/fi";
import clsx from "clsx";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";
import { isDeveloperRole } from "@/auth/roleConstants";

type MonthRow = {
  month: string;
  paid: boolean;
  amount: number | null;
  paidOn: string;
  notes: string;
  status: "paid" | "overdue" | "upcoming";
};

type Summary = {
  paidUntil: string | null;
  overdue: boolean;
  overdueSince: string | null;
  monthsOverdue: number;
};

type Draft = { paid: boolean; amount: string; paidOn: string; notes: string };

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

const monthLabel = (value: string | null) => {
  if (!value) return "-";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
};

const statusStyle: Record<MonthRow["status"], string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  upcoming: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export default function ServiceFeePage() {
  const { user } = useUserContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const allowed = isDeveloperRole(user?.role);

  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ paid: false, amount: "", paidOn: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const [batch, setBatch] = useState({ fromMonth: "", months: 6, totalAmount: "", paidOn: "", notes: "" });
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchTouched, setBatchTouched] = useState(false);

  useEffect(() => {
    if (user && !allowed) router.push("/not-permitted");
  }, [user, allowed, router]);

  const { data, isLoading } = useQuery<{ months: MonthRow[]; summary: Summary }>({
    queryKey: ["service-fee-months"],
    queryFn: async () => (await axios.get("/api/service-fee")).data,
    enabled: allowed,
  });

  const months = data?.months || [];
  const summary = data?.summary;

  const addMonths = (value: string, count: number) => {
    const [year, month] = value.split("-").map(Number);
    const date = new Date(year, month - 1 + count, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  // Default the batch to start at the first unpaid month (the month after "paid until").
  useEffect(() => {
    if (!summary || batchTouched) return;
    setBatch((prev) => ({
      ...prev,
      fromMonth: summary.paidUntil ? addMonths(summary.paidUntil, 1) : "2024-07",
      paidOn: prev.paidOn || new Date().toISOString().slice(0, 10),
    }));
  }, [summary, batchTouched]);

  const batchLastMonth = batch.fromMonth && batch.months > 0 ? addMonths(batch.fromMonth, batch.months - 1) : "";

  const updateBatch = (patch: Partial<typeof batch>) => {
    setBatchTouched(true);
    setBatch((prev) => ({ ...prev, ...patch }));
  };

  const submitBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    setBatchSaving(true);
    try {
      await axios.post("/api/service-fee", batch);
      toast.success(`Recorded ${batch.months} month${batch.months === 1 ? "" : "s"} (${monthLabel(batch.fromMonth)} – ${monthLabel(batchLastMonth)})`);
      setBatchTouched(false);
      setBatch((prev) => ({ ...prev, totalAmount: "", notes: "" }));
      queryClient.invalidateQueries({ queryKey: ["service-fee-months"] });
      queryClient.invalidateQueries({ queryKey: ["service-fee-status"] });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to record payment");
    } finally {
      setBatchSaving(false);
    }
  };

  const startEdit = (row: MonthRow) => {
    setDraft({
      paid: row.paid,
      amount: row.amount === null ? "" : String(row.amount),
      paidOn: row.paidOn,
      notes: row.notes,
    });
    setEditingMonth(row.month);
  };

  const markUnpaid = async (row: MonthRow) => {
    if (!window.confirm(`Mark ${monthLabel(row.month)} as unpaid? Partners will see the overdue warning again if this month has passed.`)) return;
    try {
      await axios.put(`/api/service-fee/${row.month}`, {
        paid: false,
        amount: row.amount === null ? "" : row.amount,
        paidOn: row.paidOn,
        notes: row.notes,
      });
      toast.success(`${monthLabel(row.month)} marked as unpaid`);
      queryClient.invalidateQueries({ queryKey: ["service-fee-months"] });
      queryClient.invalidateQueries({ queryKey: ["service-fee-status"] });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to mark month as unpaid");
    }
  };

  const save = async (month: string) => {
    setSaving(true);
    try {
      await axios.put(`/api/service-fee/${month}`, draft);
      toast.success(`${monthLabel(month)} updated`);
      setEditingMonth(null);
      queryClient.invalidateQueries({ queryKey: ["service-fee-months"] });
      queryClient.invalidateQueries({ queryKey: ["service-fee-status"] });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update month");
    } finally {
      setSaving(false);
    }
  };

  if (!user || !allowed) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Server Cost + Maintenance" />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/70">
            Paid until <b className="text-emerald-600 dark:text-emerald-400">{monthLabel(summary?.paidUntil ?? null)}</b>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/70">
            Overdue months{" "}
            <b className={summary?.overdue ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
              {summary?.monthsOverdue ?? 0}
            </b>
          </span>
          {summary?.overdueSince && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-300">
              Unpaid since <b>{monthLabel(summary.overdueSince)}</b>
            </span>
          )}
          <p className="w-full text-xs text-slate-500 sm:ml-auto sm:w-auto">
            Partners see a warning while any month up to today is unpaid.
          </p>
        </div>

        <form onSubmit={submitBatch} className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-500/5">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <FiCreditCard /> Record a payment
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              From month
              <input type="month" required value={batch.fromMonth} onChange={(e) => updateBatch({ fromMonth: e.target.value })} className={`${inputClass} mt-1`} />
            </label>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Months covered
              <div className="mt-1 flex items-center gap-1.5">
                <input type="number" min="1" max="60" required value={batch.months} onChange={(e) => updateBatch({ months: Number(e.target.value) || 1 })} className={`${inputClass} w-20`} />
                {[1, 3, 6, 12].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => updateBatch({ months: count })}
                    className={clsx(
                      "rounded-lg border px-2 py-1.5 text-xs font-bold",
                      batch.months === count
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300",
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Total amount (INR ₹)
              <input type="number" min="0" step="0.01" value={batch.totalAmount} onChange={(e) => updateBatch({ totalAmount: e.target.value })} className={`${inputClass} mt-1`} placeholder="Optional" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Paid on
              <input type="date" value={batch.paidOn} onChange={(e) => updateBatch({ paidOn: e.target.value })} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Notes
              <input value={batch.notes} onChange={(e) => updateBatch({ notes: e.target.value })} className={`${inputClass} mt-1`} placeholder="Optional" />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Covers <b>{monthLabel(batch.fromMonth)}</b> to <b>{monthLabel(batchLastMonth)}</b> ({batch.months} month{batch.months === 1 ? "" : "s"})
              {batch.totalAmount && batch.months > 0 ? `, about ₹${(Number(batch.totalAmount) / batch.months).toLocaleString("en-IN", { maximumFractionDigits: 2 })} per month` : ""}.
            </p>
            <button type="submit" disabled={batchSaving || !batch.fromMonth} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
              {batchSaving ? "Recording..." : "Record payment"}
            </button>
          </div>
        </form>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-2.5">Month</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Amount (INR ₹)</th>
                <th className="px-4 py-2.5">Paid on</th>
                <th className="px-4 py-2.5">Notes</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              )}
              {months.map((row) => {
                const editing = editingMonth === row.month;
                return (
                  <tr key={row.month} className={clsx(row.status === "overdue" && "bg-rose-50/40 dark:bg-rose-500/5")}>
                    <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100">{monthLabel(row.month)}</td>
                    <td className="px-4 py-2">
                      {editing ? (
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={draft.paid}
                            onChange={(e) => setDraft({ ...draft, paid: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          Paid
                        </label>
                      ) : (
                        <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-bold capitalize", statusStyle[row.status])}>
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editing ? (
                        <input type="number" min="0" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} className={inputClass} />
                      ) : row.amount === null ? (
                        "-"
                      ) : (
                        `₹${row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editing ? (
                        <input type="date" value={draft.paidOn} onChange={(e) => setDraft({ ...draft, paidOn: e.target.value })} className={inputClass} />
                      ) : (
                        row.paidOn || "-"
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                      {editing ? (
                        <input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className={inputClass} />
                      ) : (
                        row.notes || "-"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        {editing ? (
                          <>
                            <button type="button" disabled={saving} onClick={() => save(row.month)} title="Save" className="rounded-lg border border-emerald-300 p-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300">
                              <FiCheck className="text-sm" />
                            </button>
                            <button type="button" onClick={() => setEditingMonth(null)} title="Cancel" className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
                              <FiX className="text-sm" />
                            </button>
                          </>
                        ) : (
                          <>
                            {row.paid && (
                              <button type="button" onClick={() => markUnpaid(row)} title="Mark as unpaid" className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-2 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300">
                                <FiRotateCcw className="text-sm" />
                                Unpaid
                              </button>
                            )}
                          <button type="button" onClick={() => startEdit(row)} title="Edit month" className="rounded-lg border border-blue-300 p-1.5 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300">
                            <FiEdit2 className="text-sm" />
                          </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
