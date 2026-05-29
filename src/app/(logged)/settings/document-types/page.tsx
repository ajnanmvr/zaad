"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TypePlatformManager from "@/components/Settings/TypePlatformManager";

const DocumentTypesPage = () => {
  return (
    <>
      <Breadcrumb pageName="Document Types" />
      <TypePlatformManager
        type="document"
        title="Document Types"
        subtitle="Manage all document categories used across entity records."
        addButtonLabel="Add New Type"
        inputLabel="Document Type Name"
        inputPlaceholder="e.g., Passport, Emirates ID, Visa"
        usageLabel="documents"
        accent="emerald"
        requiredPermissions={[
          "settings.manage.document-types",
          "entities.write",
          "settings.write",
        ]}
        itemHrefBuilder={(item) => `/documents/expiry?name=${encodeURIComponent(item.name || "")}`}
      />
    </>
  );
};

export default DocumentTypesPage;
