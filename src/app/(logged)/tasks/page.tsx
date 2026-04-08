"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";
import { Suspense } from "react";

export default function MyTasksPage() {
  return (
    <>
      <Breadcrumb pageName="My Tasks" />
      <Suspense fallback={null}>
        <TaskWorkspace mode="mine" />
      </Suspense>
    </>
  );
}
