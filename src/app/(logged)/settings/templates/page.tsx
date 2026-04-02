import { redirect } from "next/navigation";

export default function LegacyTemplatesPage() {
  redirect("/settings/document-types");
}
