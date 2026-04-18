"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import SimpleRecordForm from "@/components/Forms/SimpleRecordForm";
import { useParams } from "next/navigation";

function EditTransaction() {
  const { id } = useParams();

  return (
    <div>
      <Breadcrumb pageName="Edit Record" />
      <div className="grid grid-cols-1">
        <SimpleRecordForm recordId={id?.toString()} isEdit={true} />
      </div>
    </div>
  );
}

export default EditTransaction;
