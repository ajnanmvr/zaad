import DefaultLayout from "@/components/Layouts/DefaultLayout";
import TransactionList from "@/components/Tables/TransactionList";
const TablesPage = () => {
  return (
    <DefaultLayout>
      <TransactionList type="self" />
    </DefaultLayout>
  );
};

export default TablesPage;
