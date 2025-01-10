import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import InvoiceList from "@/components/Tables/InvoiceList";

export default function Invoice() {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Invoices" />
      <InvoiceList />
    </DefaultLayout>
  )
}
