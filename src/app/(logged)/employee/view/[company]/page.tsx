"use client";

import { listEmployeesByCompanyAction } from "@/actions/company-employee";
import EmployeeList from "@/components/Tables/EmployeeList";
import { TEmployeeList } from "@/types/types";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const TablesPage = () => {
  const params = useParams();
  const [employees, setEmployees] = useState<TEmployeeList[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await listEmployeesByCompanyAction(params.company as string);
        setEmployees(result.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, [params.company]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-white">Company Employees</h1>
        <p className="text-gray-600 dark:text-gray-400">Employees associated with this company.</p>
      </div>
      <EmployeeList employees={employees} />
    </div>
  );
};

export default TablesPage;
