"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TypePlatformManager from "@/components/Settings/TypePlatformManager";

const OfficeExpenseCategoriesPage = () => {
  return (
    <>
      <Breadcrumb pageName="Office Expense Categories" />
      <TypePlatformManager
        type="office-expense-category"
        title="Office Expense Categories"
        subtitle="Manage office expense categories used for office record transactions."
        addButtonLabel="Add New Category"
        inputLabel="Category Name"
        inputPlaceholder="e.g., Utilities, Rent, Supplies"
        usageLabel="transactions"
        accent="amber"
        requiredPermissions={[
          "settings.manage.office-categories",
          "payments.write",
          "settings.write",
        ]}
        itemHrefBuilder={(item) => `/accounts/transactions?category=office_records&oc=${encodeURIComponent(item.id)}`}
      />
    </>
  );
};

export default OfficeExpenseCategoriesPage;
