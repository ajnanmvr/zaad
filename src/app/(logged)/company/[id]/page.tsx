import { redirect } from "next/navigation";

export default function CompanyPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/company/${params.id}/details`);
}
