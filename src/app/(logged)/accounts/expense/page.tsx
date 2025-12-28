"use client";

import AddRecord from '@/components/Forms/AddRecord';
import { ArrowDownRight } from 'lucide-react';

function ExpensePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <ArrowDownRight className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">Add Expense</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Record a new expense transaction
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <AddRecord type="expense" />
      </div>
    </div>
  );
}

export default ExpensePage;