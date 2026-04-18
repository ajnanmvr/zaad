"use client";

import EntityLinkedSectionPage from "@/components/entity/EntityLinkedSectionPage";
import { useParams } from "next/navigation";

export default function CompanyInvoicesPage() {
  const params = useParams<{ id: string }>();

  return <EntityLinkedSectionPage entityType="company" id={params.id} section="invoices" />;
}
