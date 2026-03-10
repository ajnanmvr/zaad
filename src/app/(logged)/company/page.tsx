import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

import CompanyList from "@/components/Tables/CompanyList";
const TablesPage = () => {

  return (
    <>
      <Breadcrumb pageName="Companies" />
      <div className="flex flex-col gap-10">
        <CompanyList />
      </div>
    </>
  );
};

export default TablesPage;
