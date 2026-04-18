import AddEmployee from "@/components/Forms/AddEmployee";
import { Suspense } from "react";

export default function AddIndividualPage() {
  return (
    <Suspense fallback={null}>
      <AddEmployee individualMode />
    </Suspense>
  );
}
