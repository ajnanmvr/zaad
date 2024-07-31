import DefaultLayout from "@/components/Layouts/DefaultLayout";
import TransactionList from "@/components/Tables/TransactionList";
const TablesPage = () => {
  return (
    <DefaultLayout>
      <TransactionList type="liability" />
    </DefaultLayout>
  );
};

export default TablesPage;
