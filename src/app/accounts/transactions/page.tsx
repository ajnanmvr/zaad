import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TransactionList from "@/components/Tables/TransactionList";
import TableThree from "@/components/Tables/TableThree";
import TableTwo from "@/components/Tables/TableTwo";

import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title: "Next.js Tables | ZaadAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Tables page for ZaadAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const TablesPage = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Transactions" />
      <TransactionList />
    </DefaultLayout>
  );
};

export default TablesPage;
