import React, { Suspense } from "react";

import AddRecord from "@/components/Forms/AddRecord";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

const CompanyExpensePage = () => {
  return (
    <>
      <Breadcrumb pageName="Company Expense" />
      <Suspense fallback={null}>
        <AddRecord type="expense" suggestionCategory="company_expense" hideBreadcrumb />
      </Suspense>
    </>
  );
};

export default CompanyExpensePage;
