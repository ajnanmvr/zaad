"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";
import { Suspense } from "react";

export default function ManageTasksPage() {
  return (
    <>
      <Breadcrumb pageName="Task Management" />
      <Suspense fallback={null}>
        <TaskWorkspace mode="manage" />
      </Suspense>
    </>
  );
}
