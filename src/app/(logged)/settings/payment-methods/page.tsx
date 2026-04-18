"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TypePlatformManager from "@/components/Settings/TypePlatformManager";

const PaymentMethodsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Payment Methods" />
      <TypePlatformManager
        type="payment"
        title="Payment Methods"
        subtitle="Manage all payment method options used across transaction records."
        addButtonLabel="Add New Method"
        inputLabel="Payment Method Name"
        inputPlaceholder="e.g., Bank, Cash, Tasdeed, Swiper"
        usageLabel="transactions"
        accent="amber"
      />
    </>
  );
};

export default PaymentMethodsPage;
