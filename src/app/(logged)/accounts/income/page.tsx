import AddRecord from "@/components/Forms/AddRecord";
import React from "react";
import { Suspense } from "react";

function IncomePage() {
  return (
    <Suspense fallback={null}>
      <AddRecord type="income" />
    </Suspense>
  );
}

export default IncomePage;
