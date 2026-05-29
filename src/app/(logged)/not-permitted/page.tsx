import Link from "next/link";
import { FiSlash } from "react-icons/fi";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

export default function NotPermittedPage() {
  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName="Not Permitted" />

      <section className="mt-6 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/40 dark:bg-slate-900/50 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            <FiSlash className="text-2xl" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Not permitted
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              You do not have permission to view this page. If you think this is a mistake, ask an administrator to review your access.
            </p>

            <div className="mt-5">
              <Link
                href="/"
                className="inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}