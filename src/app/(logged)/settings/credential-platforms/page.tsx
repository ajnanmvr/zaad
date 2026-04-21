"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TypePlatformManager from "@/components/Settings/TypePlatformManager";

const CredentialPlatformsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Credential Platforms" />
      <TypePlatformManager
        type="credential"
        title="Credential Platforms"
        subtitle="Manage all credential platform options used for entity credentials."
        addButtonLabel="Add New Platform"
        inputLabel="Platform Name"
        inputPlaceholder="e.g., Gmail, Outlook, GitHub"
        usageLabel="credentials"
        accent="blue"
        itemHrefBuilder={(item) => `/credentials?platform=${encodeURIComponent(item.platform || "")}`}
      />
    </>
  );
};

export default CredentialPlatformsPage;
