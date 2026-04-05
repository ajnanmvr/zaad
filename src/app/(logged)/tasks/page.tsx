"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";

export default function MyTasksPage() {
  return (
    <>
      <Breadcrumb pageName="My Tasks" />
      <TaskWorkspace mode="mine" />
    </>
  );
}
