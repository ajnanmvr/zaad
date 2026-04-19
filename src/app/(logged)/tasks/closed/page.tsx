"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";
import { FiAlertCircle } from "react-icons/fi";
import { Suspense } from "react";

export default function ClosedTasksPage() {
  return (
    <>
      <Breadcrumb pageName="Closed Tasks" />
      {/* Alert banner indicating this is the closed tasks view */}
      <div className="mb-6 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <FiAlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Completed & Cancelled Tasks
            </p>
            <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-200">
              You are viewing archived tasks. These tasks have been completed or cancelled.
            </p>
          </div>
        </div>
      </div>
      <Suspense fallback={null}>
        <TaskWorkspace mode="manage" initialView="list" initialStatusGroup="closed" />
      </Suspense>
    </>
  );
}
