"use client"
import TransactionList from "@/components/Tables/TransactionList";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
const TablesPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (type === "company" && id) {
      router.replace(`/company/${id}/records`);
    }
  }, [id, router, type]);

  if (type === "company") {
    return null;
  }

  return (
    <>
      <TransactionList type={type} id={id} />
    </>
  );
};

export default TablesPage;
