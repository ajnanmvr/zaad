"use client";

import { useParams } from "next/navigation";

import EntityOverviewHub from "@/components/entity/EntityOverviewHub";

export default function IndividualOverviewPage() {
  const params = useParams<{ id: string }>();

  return <EntityOverviewHub entityType="individual" id={params.id} />;
}
