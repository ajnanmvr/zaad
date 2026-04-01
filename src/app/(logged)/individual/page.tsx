import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import IndividualList from "@/components/Tables/IndividualList";

const IndividualsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Individuals" />
      <div className="flex flex-col gap-10">
        <IndividualList />
      </div>
    </>
  );
};

export default IndividualsPage;
