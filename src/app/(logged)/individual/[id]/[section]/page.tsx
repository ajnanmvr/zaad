"use client";

import { notFound, useParams } from "next/navigation";

import EntitySectionPage from "@/components/entity/EntitySectionPage";

const VALID_SECTIONS = ["details", "documents", "credentials", "handovers", "tasks"] as const;

export default function IndividualSectionPage() {
  const params = useParams<{ id: string; section: string }>();

  if (!VALID_SECTIONS.includes(params.section as (typeof VALID_SECTIONS)[number])) {
    notFound();
  }

  return (
    <EntitySectionPage
      entityType="individual"
      id={params.id}
      section={params.section as (typeof VALID_SECTIONS)[number]}
    />
  );
}
