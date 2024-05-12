import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { TEmployeeList } from "@/types/types";
import clsx from "clsx";

const ChatCard = () => {
  const [employees, setEmployees] = useState<TEmployeeList>([{
    id: "",
    name: "",
    expiryDate: "",
    docs: 0,
    status: "",
    company: { id: "", name: "" }
  }])
  const fetchEmployees = async () => {
    try {
      const data = await axios.get("/api/employee")
      setEmployees(data.data.data.slice(0, 5))
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    fetchEmployees()
  }, [])
  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
        Employees
      </h4>

      <div>
        {employees.map((employee, key) => (
          <Link
            href="/"
            className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
            key={key}
          >
            <div
              className={clsx(employee.status === "renewal" ? "bg-meta-6": employee.status === "expired" ? "bg-red": `bg-meta-3`, "h-3.5 w-3.5 rounded-full border-2 border-white")}
            ></div>

            <div className="flex flex-1 items-center justify-between">
              <div>
                <h5 className="font-medium text-black dark:text-white">
                  {employee.name}
                </h5>
                <p>
                  <span className="text-sm text-black dark:text-white">
                    {employee.company.name}
                  </span>
                  <span className="text-xs"> . {employee.status}</span>
                </p>
              </div>
              {employee.docs !== 0 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <span className="text-sm font-medium text-white">
                    {employee.docs}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChatCard;
