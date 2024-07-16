import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import TransactionList from "@/components/Tables/TransactionList";
const TablesPage = () => {
  return (
    <DefaultLayout>
      <TransactionList />
    </DefaultLayout>
  );
};

export default TablesPage;
