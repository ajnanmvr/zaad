"use client"
import TransactionList from "@/components/Tables/TransactionList";
import { useParams } from "next/navigation";
const TablesPage = () => {
  const { type, id } = useParams()
  return (
    <>
      <TransactionList type={type} id={id} />
    </>
  );
};

export default TablesPage;
