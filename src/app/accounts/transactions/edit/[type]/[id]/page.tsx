"use client";
import EditRecord from "@/components/Forms/AddRecord";
import { useParams } from "next/navigation";

function EditTransaction() {
  const { type } = useParams();

  return <EditRecord type={type.toString()} edit={true} />;
}

export default EditTransaction;
