import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import CompanyList from "@/components/Tables/CompanyList";
const TablesPage = () => {

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Companies" />
      <div className="flex flex-col gap-10">
        <CompanyList sort="a"/>
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
