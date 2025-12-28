"use client";

import ModernEmployeeList from "@/components/Tables/ModernEmployeeList";
import { Users } from "lucide-react";

const EmployeePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">Employees</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage and view all your employees
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <ModernEmployeeList />
      </div>
    </div>
  );
};

export default EmployeePage;
