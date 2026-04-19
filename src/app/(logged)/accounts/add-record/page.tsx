import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import SimpleRecordForm from "@/components/Forms/SimpleRecordForm";

export const dynamic = "force-dynamic";

export default function AddRecordPage() {
  return (
    <>
      <Breadcrumb pageName="Add Record" />
      <div className="grid grid-cols-1">
        <SimpleRecordForm />
      </div>
    </>
  );
}
