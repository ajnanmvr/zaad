
"use client"
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TCompanyData } from "@/libs/types";
import { useParams } from "next/navigation";
import clsx from "clsx";

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
  console.log(company);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-boxdark shadow-default rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  {company?.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  {company?.companyType}
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
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company?.licenseNo || "-"}</span>
                  </li>
                  <li>
                    Emirates/Area:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company?.emirates || "-"}</span>
                  </li>
                  <li>
                    Phone 1:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company?.phone1 || "-"}</span>
                  </li>
                  <li>
                    Phone 2:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company?.phone2 || "-"}</span>
                  </li>
                  <li>
                    Email:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company?.email || "-"}</span>
                  </li>
                  <li>
                    Transaction No:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company?.transactionNo || "-"}</span>
                  </li>
                  <li>
                    Mainland/Freezone:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company?.isMainland ? "Mainland" : "Freezone"}</span>
                  </li>
                  <li>
                    Remarks:
                    <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{company?.remarks || "-"}</span>
                  </li>
                </ul>
              </div>
              <div className="">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                  Passwords
                </h3>
                <ul>
                  {company?.password?.map((pass, index) => (
                    <li key={index}>
                      <span className="font-medium">{pass.platform}:</span>
                      <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{pass.username || "-"}</span>
                      <span className="bg-primary font-medium mx-1 border-primary bg-opacity-20 border rounded px-1">{pass.password || "-"}</span>

                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                Documents
              </h3>

              <div className="max-w-full overflow-x-auto mb-5">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                      <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                        Name
                      </th>
                      <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                        Issue Date
                      </th>
                      <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                        Expiry Date
                      </th>
                      <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                        Status
                      </th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>

                    {company?.documents?.map(({ name, status, issueDate, expiryDate }, key) => (
                      <tr key={key}>
                        <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                          <h5 className="font-medium capitalize text-black dark:text-white">
                            {name}
                          </h5>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {issueDate}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {expiryDate}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p
                            className={`inline-flex capitalize rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium

                             ${status === "valid"
                                ? "bg-success text-success"
                                : status === "expired"
                                  ? "bg-danger text-danger"
                                  : "bg-warning text-warning"
                              } 
                      `}
                          >
                            {status}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <div className="flex items-center space-x-3.5">
                            <Link href={`/company/${id}`} className="hover:text-primary">
                              <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.5562 8.99981 13.5562C13.1061 13.5562 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.44374 8.99981 4.44374C4.89356 4.44374 2.4748 7.95936 1.85605 8.99999Z"
                                  fill=""
                                />
                                <path
                                  d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 7.875C8.38125 7.875 7.875 8.38125 7.875 9C7.875 9.61875 8.38125 10.125 9 10.125C9.61875 10.125 10.125 9.61875 10.125 9C10.125 8.38125 9.61875 7.875 9 7.875Z"
                                  fill=""
                                />
                              </svg>
                            </Link>
                            <button className="hover:text-primary">
                              <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M9.0002 7.79065C11.0814 7.79065 12.7689 6.1594 12.7689 4.1344C12.7689 2.1094 11.0814 0.478149 9.0002 0.478149C6.91895 0.478149 5.23145 2.1094 5.23145 4.1344C5.23145 6.1594 6.91895 7.79065 9.0002 7.79065ZM9.0002 1.7719C10.3783 1.7719 11.5033 2.84065 11.5033 4.16252C11.5033 5.4844 10.3783 6.55315 9.0002 6.55315C7.62207 6.55315 6.49707 5.4844 6.49707 4.16252C6.49707 2.84065 7.62207 1.7719 9.0002 1.7719Z"
                                  fill=""
                                />
                                <path
                                  d="M10.8283 9.05627H7.17207C4.16269 9.05627 1.71582 11.5313 1.71582 14.5406V16.875C1.71582 17.2125 1.99707 17.5219 2.3627 17.5219C2.72832 17.5219 3.00957 17.2407 3.00957 16.875V14.5406C3.00957 12.2344 4.89394 10.3219 7.22832 10.3219H10.8564C13.1627 10.3219 15.0752 12.2063 15.0752 14.5406V16.875C15.0752 17.2125 15.3564 17.5219 15.7221 17.5219C16.0877 17.5219 16.3689 17.2407 16.3689 16.875V14.5406C16.2846 11.5313 13.8377 9.05627 10.8283 9.05627Z"
                                  fill=""
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>



              {/* <ul>
                {company?.documents?.map((doc, index) => (
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
              </ul> */}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                Transactions
              </h3>



              <div className="flex flex-col">
                <div className="bg-gray-2 text-left  justify-around flex dark:bg-meta-4">
                  <div className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                    Invoice No
                  </div>
                  <div className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                    Amount                      </div>
                  <div className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                    Particular                      </div>
                  <div className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                    Date                      </div>
                  <div className="px-4 py-4 font-medium text-black dark:text-white">
                    Actions
                  </div>
                </div>

                {company?.transactions?.map((record, key) => (
                  <div
                    className={"grid grid-cols-3 sm:grid-cols-5 border-b border-stroke dark:border-strokedark"}
                    key={key}
                  >


                    <div className="flex items-center justify-center p-2.5 xl:p-5">
                      <p className="text-black dark:text-white">{record.invoiceNo}</p>
                    </div>

                    <div className="flex items-center justify-center p-2.5 xl:p-5">
                      <p className={clsx(record.type === "income" ? "text-meta-3" : "text-red")}>{record.amount} <span className="text-xs">AED</span></p>
                    </div>

                    <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                      <p className="text-meta-5">{record.particular}</p>
                    </div>
                    <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                      <p className="text-black dark:text-white">{record.date}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>


          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SingleCompany;
