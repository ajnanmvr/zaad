
"use client"
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TCompanyData } from "@/libs/types";
import { useParams } from "next/navigation";

const SingleCompany = () => {
  const [company, setCompany] = useState<TCompanyData>({ name: "" })
  const { id } = useParams()
  const fetchData = async () => {
    try {
      const data = await axios.get(`/api/company/${id}`)
      console.log(data.data.data)
      setCompany(data.data.data)
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    fetchData()
  }, [])

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-boxdark shadow-default rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  {company.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  {company.companyType || ""}
                </p>
              </div>
              <div className="flex gap-1">

                <Link
                  href={`${id}/edit`}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
                >
                  Edit
                </Link>
                <Link
                  href={`/employees/create/${id}`}
                  className="inline-flex items-center justify-center rounded-md bg-red px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
                >
                  Delete
                </Link></div></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                  Company Details
                </h3>
                <ul className="grid grid-cols-2 gap-x-4">
                  <li>
                    License No:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company.licenseNo || "dfdsfd fdjfldsj"}</span>
                  </li>
                  <li>
                    Emirates/Area:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company.emirates || "-"}</span>
                  </li>
                  <li>
                    Phone 1:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company.phone1 || "-"}</span>
                  </li>
                  <li>
                    Phone 2:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company.phone2 || "-"}</span>
                  </li>
                  <li>
                    Email:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company.email || "-"}</span>
                  </li>
                  <li>
                    Transaction No:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company.transactionNo || "-"}</span>
                  </li>
                  <li>
                    Mainland/Freezone:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company.isMainland ? "Mainland" : "Freezone"}</span>
                  </li>
                  <li>
                    Remarks:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company.remarks || "-"}</span>
                  </li>
                </ul>
              </div>
              <div className="">
              <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                Documents
              </h3>
              <ul>
                {company.documents?.map((doc, index) => (
                  <li key={index} className="mb-2">
                    <span className="font-medium">{doc.name} </span>
                    <span className="text-sm">
                      valid from
                      <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{doc.issueDate || "-"}</span>
                      to
                      <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{doc.expiryDate || "-"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            </div>

            <div className="mt-8">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                  Passwords
                </h3>
                <ul>
                  {company.password?.map((pass, index) => (
                    <li key={index}>
                      <span className="font-medium">{pass.platform}:</span>
                      <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{pass.username || "-"}</span>
                      <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{pass.password || "-"}</span>

                    </li>
                  ))}
                </ul>
              </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SingleCompany;
