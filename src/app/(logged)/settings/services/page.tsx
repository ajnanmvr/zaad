"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ServicePricelistManager from "@/components/Settings/ServicePricelistManager";

const ServicePricelistPage = () => (
  <>
    <Breadcrumb pageName="Service Pricelist" />
    <div className="mx-auto max-w-4xl">
      <ServicePricelistManager />
    </div>
  </>
);

export default ServicePricelistPage;
