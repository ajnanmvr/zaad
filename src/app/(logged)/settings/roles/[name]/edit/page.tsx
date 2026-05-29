import RoleForm from "@/components/Settings/RoleForm";

export default function EditRolePage({ params }: { params: { name: string } }) {
  const { name } = params;
  return <RoleForm mode="edit" roleName={name} />;
}
