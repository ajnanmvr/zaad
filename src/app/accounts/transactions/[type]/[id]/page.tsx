"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import TransactionList from "@/components/Tables/TransactionList";
import { useParams } from "next/navigation";
const TablesPage = () => {
  const { type, id } = useParams()
  return (
    <DefaultLayout>
      <Breadcrumb pageName={`${type} Transactions`} />
      <TransactionList type={type} id={id} />
    </DefaultLayout>
  );
};

export default TablesPage;
