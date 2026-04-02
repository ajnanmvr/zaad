"use client";

import { notFound, useParams } from "next/navigation";

import EntitySectionPage from "@/components/entity/EntitySectionPage";

const VALID_SECTIONS = [
  "details",
  "documents",
  "credentials",
  "handovers",
  "employees",
  "records",
  "invoices",
] as const;

export default function CompanySectionPage() {
  const params = useParams<{ id: string; section: string }>();

  if (!VALID_SECTIONS.includes(params.section as (typeof VALID_SECTIONS)[number])) {
    notFound();
  }

  return (
    <EntitySectionPage
      entityType="company"
      id={params.id}
      section={params.section as (typeof VALID_SECTIONS)[number]}
    />
  );
}
