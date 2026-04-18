"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";
import { Suspense } from "react";

export default function MyTasksPage() {
  return (
    <>
      <Breadcrumb pageName="Tasks List" />
      <Suspense fallback={null}>
        <TaskWorkspace mode="manage" initialView="list" />
      </Suspense>
    </>
  );
}
