"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";

export default function ManageTasksPage() {
  return (
    <>
      <Breadcrumb pageName="Task Management" />
      <TaskWorkspace mode="manage" />
    </>
  );
}
