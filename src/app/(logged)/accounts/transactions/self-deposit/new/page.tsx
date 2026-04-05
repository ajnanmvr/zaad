"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import SelfDepositForm from "@/components/Forms/SelfDepositForm";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

const NewTransferPage = () => {
  return (
    <>
      <Breadcrumb pageName="New Transfer" />

      <div className="mb-6">
        <Link
          href="/accounts/transactions/self-deposit"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Transfers
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-4">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Create New Transfer</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Move balance between your payment methods instantly and securely
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/30">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">How it works:</h3>
              <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">1</span>
                  <span>Select the source payment method</span>
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">2</span>
                  <span>Enter the transfer amount</span>
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">3</span>
                  <span>Choose the destination method</span>
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">4</span>
                  <span>Confirm and complete the transfer</span>
                </li>
              </ol>
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-600">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Benefits:</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Instant balance transfers
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Complete audit trail
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  No external transactions
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Fully traceable records
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <SelfDepositForm />
        </div>
      </div>
    </>
  );
};

export default NewTransferPage;
