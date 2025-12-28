"use client";

import ModernCompanyList from "@/components/Tables/ModernCompanyList";

const ClientsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-black dark:text-white">Clients</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and view all your company clients
          </p>
        </div>
      </div>

      <div className="p-6">
        <ModernCompanyList />
      </div>
    </div>
  );
};

export default ClientsPage;
