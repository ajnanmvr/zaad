"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";
import { Suspense } from "react";

export default function ManageTasksPage() {
  return (
    <>
      <Breadcrumb pageName="Task Calendar" />
      <Suspense fallback={null}>
        <TaskWorkspace mode="manage" initialView="calendar" />
      </Suspense>
    </>
  );
}
