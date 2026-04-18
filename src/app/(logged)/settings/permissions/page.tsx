import { redirect } from "next/navigation";

export default function PermissionsPage() {
  redirect("/settings/roles");
}