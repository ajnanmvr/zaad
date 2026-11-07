"use client";

import EntityLinkedSectionPage from "@/components/entity/EntityLinkedSectionPage";
import { useParams } from "next/navigation";

export default function EmployeeJobsPage() {
  const params = useParams<{ id: string }>();

  return <EntityLinkedSectionPage entityType="employee" id={params.id} section="jobs" />;
}
