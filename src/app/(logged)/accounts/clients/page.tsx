import CompanyList from "@/components/Tables/CompanyList";
const TablesPage = () => {

  return (<div className="flex flex-col gap-10">
        <CompanyList sort="a"/>
      </div>);
};

export default TablesPage;
