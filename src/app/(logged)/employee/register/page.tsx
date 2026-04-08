import AddEmployee from "@/components/Forms/AddEmployee"
import { Suspense } from "react"
export default function AddEmployeeInside() {

    return (
        <Suspense fallback={null}>
            <AddEmployee />
        </Suspense>
    )
}
