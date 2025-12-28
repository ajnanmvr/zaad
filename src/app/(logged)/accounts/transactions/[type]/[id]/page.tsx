"use client";

import TransactionList from "@/components/Tables/TransactionList";
import { useParams } from "next/navigation";

const TablesPage = () => {
  const { type, id } = useParams();

  return (
    <div className="p-4 md:p-6">
      <TransactionList type={type} id={id} />
    </div>
  );
};

export default TablesPage;
