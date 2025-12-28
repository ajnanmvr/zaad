"use client";

import ModernTransactionList from "@/components/Tables/ModernTransactionList";
import { ArrowRightLeft } from "lucide-react";

const TransactionsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <ArrowRightLeft className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">Transactions</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View all your transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <ModernTransactionList />
      </div>
    </div>
  );
};

export default TransactionsPage;
