import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

import InvoiceList from "@/components/Tables/InvoiceList";

export default function Invoice() {
  return (
    <>
      <Breadcrumb pageName="Invoices" />
      <InvoiceList />
    </>
  )
}
