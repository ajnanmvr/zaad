"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TypePlatformManager from "@/components/Settings/TypePlatformManager";

const PaymentStatusesPage = () => {
  return (
    <>
      <Breadcrumb pageName="Payment Statuses" />
      <TypePlatformManager
        type="payment-status"
        title="Payment Statuses"
        subtitle="Manage status options used across transaction records."
        addButtonLabel="Add New Status"
        inputLabel="Payment Status Name"
        inputPlaceholder="e.g., Office Expense, Liability Payment, Ready Cash"
        usageLabel="transactions"
        accent="amber"
        requiredPermissions={[
          "settings.manage.payment-statuses",
          "payments.write",
          "settings.write",
        ]}
        itemHrefBuilder={(item) => `/accounts/transactions?s=${encodeURIComponent(item.id)}`}
      />
    </>
  );
};

export default PaymentStatusesPage;
