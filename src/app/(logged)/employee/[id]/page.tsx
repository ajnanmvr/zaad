"use client";

import { useParams } from "next/navigation";

import EntityOverviewHub from "@/components/entity/EntityOverviewHub";

export default function EmployeeOverviewPage() {
  const params = useParams<{ id: string }>();

  return <EntityOverviewHub entityType="employee" id={params.id} />;
}
