import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CompanyList from "@/components/Tables/CompanyList";
import { FiBriefcase, FiUsers } from "react-icons/fi";

const TablesPage = () => {
  return (
    <>
      <Breadcrumb pageName="Clients" />

      <section className="relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 shadow-sm dark:border-indigo-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-300/60 bg-indigo-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-700/40 dark:bg-indigo-900/30 dark:text-indigo-300">
            <FiUsers />
            Account Clients
          </p>
          <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            Clients
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Browse all client companies linked to finance operations, with quick navigation to each client ledger.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-100">
                <FiBriefcase />
                Company Clients
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200/80 bg-white/80 p-4 dark:border-indigo-800/40 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Use</p>
              <p className="mt-1 text-sm font-black text-indigo-600 dark:text-indigo-400">
                Open Client Ledger
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-10">
        <CompanyList sort="a"/>
      </div>
    </>
  );
};

export default TablesPage;
