import { redirect } from "next/navigation";

export default function IndividualPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/individual/${params.id}/details`);
}
