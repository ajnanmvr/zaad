import AddInvoice from "@/components/Forms/AddInvoice";
import { Suspense } from "react";
const TablesPage = () => {
    return (
        <Suspense fallback={null}>
            <AddInvoice />
        </Suspense>
    );
};

export default TablesPage;
