import { redirect } from "next/navigation";

export default function EmployeePage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/employee/${params.id}/details`);
}
