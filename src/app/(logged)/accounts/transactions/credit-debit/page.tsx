"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreditDebitPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/accounts/transactions/credit-list");
  }, [router]);

  return null;
}
