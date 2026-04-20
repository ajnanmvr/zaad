"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";
import { Suspense } from "react";

export default function ClosedTasksPage() {
  return (
    <>
      <Breadcrumb pageName="Closed Tasks" />
      <Suspense fallback={null}>
        <TaskWorkspace mode="manage" initialView="list" initialStatusGroup="closed" />
      </Suspense>
    </>
  );
}
