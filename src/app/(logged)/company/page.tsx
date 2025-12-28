"use client";

import ModernCompanyList from "@/components/Tables/ModernCompanyList";
import { Building2 } from "lucide-react";

const CompanyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">Companies</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage and view all your companies
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <ModernCompanyList />
      </div>
    </div>
  );
};

export default CompanyPage;
