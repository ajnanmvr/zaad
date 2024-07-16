"use client"
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import TransactionList from "@/components/Tables/TransactionList";
import { useParams } from "next/navigation";
const TablesPage = () => {
  const { type, id } = useParams()
  return (
    <DefaultLayout>
      <TransactionList type={type} id={id} />
    </DefaultLayout>
  );
};

export default TablesPage;
