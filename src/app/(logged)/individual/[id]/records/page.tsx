"use client";

import EntityLinkedSectionPage from "@/components/entity/EntityLinkedSectionPage";
import { useParams } from "next/navigation";

export default function IndividualRecordsPage() {
  const params = useParams<{ id: string }>();

  return <EntityLinkedSectionPage entityType="individual" id={params.id} section="records" />;
}
