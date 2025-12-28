"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent"></div>
    </div>
  );
}
