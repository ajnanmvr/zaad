import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import IndividualList from "@/components/Tables/IndividualList";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";

const IndividualsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Individuals" />
      <div className="flex flex-col gap-10">
        <div className="flex justify-end">
          <Link
            href="/individual/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-opacity-90"
          >
            <FiPlus />
            Add Individual
          </Link>
        </div>
        <IndividualList />
      </div>
    </>
  );
};

export default IndividualsPage;
