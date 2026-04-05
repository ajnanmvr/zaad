import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TransactionList from "@/components/Tables/TransactionList";
import { FiArrowDownLeft, FiLayers, FiShield } from "react-icons/fi";

const SelfDepositTrackingPage = () => {
  return (
    <>
      <Breadcrumb pageName="Self Deposit Tracker" />

      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-5 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
            <FiArrowDownLeft />
            Internal Fund Movement
          </p>
          <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            Self Deposit Tracking
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Dedicated ledger of self deposit exchange entries with complete traceability and timeline.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Scope</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-100">
                <FiLayers /> Self Deposit Only
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-200/80 bg-white/80 p-4 dark:border-cyan-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Classification</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-cyan-600 dark:text-cyan-400">
                <FiArrowDownLeft /> Exchange Flow
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-4 dark:border-emerald-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Control</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-emerald-600 dark:text-emerald-400">
                <FiShield /> Audited Records
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <TransactionList type="self-deposit" />
      </div>
    </>
  );
};

export default SelfDepositTrackingPage;
