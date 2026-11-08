"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { FiAlertTriangle, FiServer, FiX } from "react-icons/fi";
import { useUserContext } from "@/contexts/UserContext";

type ServiceFeeStatus = {
  paidUntil: string | null;
  overdue: boolean;
  overdueSince: string | null;
  monthsOverdue: number;
  visible: boolean;
};

const formatMonth = (value: string | null) => {
  if (!value) return "";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
};

function useServiceFeeStatus() {
  const { user } = useUserContext();
  const { data } = useQuery<ServiceFeeStatus>({
    queryKey: ["service-fee-status"],
    queryFn: async () => (await axios.get("/api/service-fee/status")).data,
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
  return data && data.visible ? data : null;
}

const describe = (data: ServiceFeeStatus) => ({
  since: formatMonth(data.overdueSince),
  paidUntil: data.paidUntil ? formatMonth(data.paidUntil) : "never",
  months: `${data.monthsOverdue} month${data.monthsOverdue === 1 ? "" : "s"}`,
});

// Slim bar for the bottom of the content area (rendered by DefaultLayout, beside the sidebar).
export function ServiceFeeBar() {
  const data = useServiceFeeStatus();
  if (!data) return null;
  const { since, paidUntil, months } = describe(data);

  return (
    <div className="relative z-10 shrink-0 border-t-2 border-rose-700 bg-rose-600 px-3 py-2 text-white sm:px-4">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-2.5 text-xs font-semibold sm:justify-center sm:text-sm">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
          <FiServer className="h-4 w-4" />
        </span>
        <p className="min-w-0 break-words leading-snug">
          Server cost + maintenance charges overdue since {since} ({months}) · paid until {paidUntil}.
          <span className="hidden md:inline"> Please clear the dues to keep the service running.</span>
        </p>
      </div>
    </div>
  );
}

// Large warning modal for partners, opened on every page load/refresh.
export default function ServiceFeeNotice() {
  const data = useServiceFeeStatus();
  const [modalOpen, setModalOpen] = useState(false);
  const visible = Boolean(data);

  // Closing only hides it until the next refresh.
  useEffect(() => {
    if (visible) setModalOpen(true);
  }, [visible]);

  if (!data || !modalOpen) return null;

  const closeModal = () => setModalOpen(false);

  const { since, paidUntil, months } = describe(data);

  return (
    <>
      {(
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="h-2 w-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-500" />
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-4 top-5 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <FiX className="h-5 w-5" />
            </button>

            <div className="px-8 pb-8 pt-8 text-center">
              <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15">
                <FiAlertTriangle className="h-8 w-8" />
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Server cost + maintenance charges overdue
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
                The server cost + maintenance charges for this platform have not been paid since <b>{since}</b>. They are paid up to{" "}
                <b>{paidUntil}</b>, so <b>{months}</b> {data.monthsOverdue === 1 ? "is" : "are"} now overdue.
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Please clear the outstanding amount to avoid any interruption of the service.
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
