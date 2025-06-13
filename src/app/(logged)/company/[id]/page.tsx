"use client"
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TCompanyData } from "@/types/types";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { useUserContext } from "@/contexts/UserContext";

const SingleCompany = () => {
  const router = useRouter()
  const [company, setCompany] = useState<TCompanyData | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isEditDocsOpen, setIsEditDocsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true)
  const [editData, setEditData] = useState({
    name: "",
    issueDate: "",
    expiryDate: "",
  });
  const [isConfirmationOpenCompany, setIsConfirmationOpenCompany] = useState(false);
  const { id }: { id: string } = useParams()
  const { user } = useUserContext();


  const fetchData = async () => {
    try {
      const data = await axios.get(`/api/company/${id}`)
      setCompany(data.data.data)
      setIsLoading(false)
    } catch (error) {
      console.log(error);
    }
  }

  const handleDelete = (deleteId: string) => {
    setSelectedDocumentId(deleteId);
    setIsConfirmationOpen(true);
  }
  const handleEdit = (editId: string) => {
    const selectedDocument = company?.documents.find(doc => doc._id === editId);
    if (selectedDocument) {
      setEditData({
        name: `${selectedDocument.name}`,
        issueDate: `${selectedDocument.issueDate}`,
        expiryDate: `${selectedDocument.expiryDate}`,
      });
      setSelectedDocumentId(editId);
      setIsEditDocsOpen(true);
    } else {
      console.error("Document not found!");
    }
  }
  const confirmDelete = async () => {
    console.log("Deleting Document with ID:", selectedDocumentId);
    const data = await axios.delete(`/api/company/${id}/doc/${selectedDocumentId}`);
    console.log(data);
    fetchData();
    setIsConfirmationOpen(false);
  };
  const confirmDeleteCompany = async () => {
    await axios.delete(`/api/company/${id}`);
    router.push("/company")
  };
  const saveEdits = async () => {
    console.log("Updating Document with ID:", selectedDocumentId);
    const data = await axios.put(`/api/company/${id}/doc/${selectedDocumentId}`, editData);
    setIsEditDocsOpen(false);
    fetchData();
  };
  const closeModal = () => {
    setSelectedDocumentId(null);
    setIsConfirmationOpen(false);
    setIsConfirmationOpenCompany(false);
    setIsEditDocsOpen(false);

  }
  const handleChange = (e: any) => {
    setEditData({
      ...editData, [e.target.name]: e.target.value
    })
  }


  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trigger = useRef<any>(null);
  const dropdown = useRef<any>(null);



  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          message="Are you sure you want to delete this document?"
          onConfirm={confirmDelete}
          onCancel={closeModal}
        />
        <ConfirmationModal
          isOpen={isConfirmationOpenCompany}
          message="Are you sure you want to delete this company?"
          onConfirm={confirmDeleteCompany}
          onCancel={closeModal}
        />
        {isEditDocsOpen && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-black p-8 rounded-lg shadow-lg">

              <div className="mt-5">
                <div className="mb-4.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Document Name <span className="text-meta-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={editData.name}
                    onChange={handleChange}
                    placeholder="Enter document name"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                  <div className="w-full xl:w-1/2">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      name="issueDate"
                      value={editData.issueDate}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                  <div className="w-full xl:w-1/2">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Expiry Date <span className="text-meta-1">*</span>
                    </label>
                    <input
                      title="Expiry Date"
                      type="date"
                      name="expiryDate"
                      value={editData.expiryDate}
                      onChange={handleChange}
                      required
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
              </div>


              <div className="flex justify-end">
                <button onClick={closeModal} className="mr-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg">
                  Cancel
                </button>
                <button onClick={saveEdits} className="px-4 py-2 bg-primary hover:bg-red-600 text-white rounded-lg">
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
        {isLoading ? <div className="flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
          : <div className="bg-white dark:bg-boxdark shadow-default rounded-lg overflow-hidden">
            <div className="px-6 py-8 sm:p-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl capitalize font-bold text-black dark:text-white">
                    {company?.name}
                  </h2>
                  <p className="text-gray-600 capitalize dark:text-gray-400 mb-8">
                    {company?.companyType}
                  </p>
                </div>
                <div className="flex gap-1 items-center">
                  <div className="relative">
                    <Link
                      ref={trigger}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-4"
                      href="#"
                    >
                      <span className="hidden capitalize text-right lg:block">
                        <span className="block text-sm font-medium">
                          More
                        </span>

                      </span>

                      <svg
                        className="hidden fill-current sm:block"
                        width="12"
                        height="8"
                        viewBox="0 0 12 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z"
                          fill=""
                        />
                      </svg>
                    </Link>

                    <div
                      ref={dropdown}
                      onFocus={() => setDropdownOpen(true)}
                      onBlur={() => setDropdownOpen(false)}
                      className={`absolute right-0 mt-4 py-3 flex w-40 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${dropdownOpen === true ? "block" : "hidden"
                        }`}
                    >
                      {user?.role === "partner" && (<>
                        <Link href={`/accounts/transactions/company/${id}`} className="px-6 py-2 text-sm font-medium duration-300 ease-in-out hover:text-primary hover:bg-primary hover:bg-opacity-10 lg:text-base">
                          Records
                        </Link></>)}
                      <Link href={`/employee/view/${id}`} className="px-6 py-2 text-sm font-medium duration-300 ease-in-out hover:text-primary hover:bg-primary hover:bg-opacity-10 lg:text-base">
                        Employees
                      </Link>
                      <Link href={`/employee/register/${id}`} className="px-6 py-2 text-sm font-medium duration-300 ease-in-out hover:text-primary hover:bg-primary hover:bg-opacity-10 lg:text-base">
                        New Employee
                      </Link>
                      <Link href={`/company/${id}/edit`} className="px-6 py-2 text-sm font-medium duration-300 ease-in-out hover:text-primary hover:bg-primary hover:bg-opacity-10 lg:text-base">
                        Edit
                      </Link>
                      <button onClick={() => setIsConfirmationOpenCompany(true)} className="flex justify-start px-6 py-2 text-sm font-medium duration-300 ease-in-out text-red hover:bg-red hover:bg-opacity-10 lg:text-base">
                        Delete
                      </button>
                    </div>
                  </div>
                </div></div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-h-44">
                <div>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                    Company Details
                  </h3>
                  <ul className="flex flex-col">
                    {company?.licenseNo && (
                      <li>
                        License No:
                        <span className="font-medium mx-1 break-words">{company.licenseNo}</span>
                      </li>
                    )}
                    {company?.emirates && (
                      <li>
                        Emirates/Area:
                        <span className="font-medium mx-1 break-words">{company.emirates}</span>
                      </li>
                    )}
                    {company?.phone1 && (
                      <li>
                        Phone 1:
                        <span className="font-medium mx-1 break-words">{company.phone1}</span>
                      </li>
                    )}
                    {company?.phone2 && (
                      <li>
                        Phone 2:
                        <span className="font-medium mx-1 break-words">{company.phone2}</span>
                      </li>
                    )}
                    {company?.email && (
                      <li>
                        Email:
                        <span className="font-medium mx-1 break-words">{company.email}</span>
                      </li>
                    )}
                    {company?.transactionNo && (
                      <li>
                        Transaction No:
                        <span className="font-medium mx-1 break-words">{company.transactionNo}</span>
                      </li>
                    )}
                    {company?.isMainland && (
                      <li>
                        Mainland/Freezone:
                        <span className="font-medium mx-1 break-words">{company.isMainland}</span>
                      </li>
                    )}
                    {company?.remarks && (
                      <li>
                        Remarks:
                        <span className="font-medium mx-1 break-words">{company.remarks}</span>
                      </li>
                    )}
                  </ul>
                </div>

                {company?.password?.length !== 0 && (
                  <div className="">
                    <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                      Passwords.
                    </h3>
                    <ul>
                      {company?.password?.map((pass, index) => (
                        <li key={index}>
                          <span className="font-medium">{pass.platform}:</span>
                          <span className="font-medium mx-1 break-words">{pass.username}</span>
                          <span className="font-medium mx-1 break-words">{pass.password}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {company?.documents?.length !== 0 && (

                <div className="mt-8">
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

                        {company?.documents?.map(({ name, status, issueDate, expiryDate, _id }, key) => (
                          <tr key={key}>
                            <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                              <h5 className="font-medium capitalize text-black dark:text-white">
                                {name || "---"}
                              </h5>
                            </td>
                            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                              <p className="text-black dark:text-white">
                                {issueDate || "---"}
                              </p>
                            </td>
                            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                              <p className="text-black dark:text-white">
                                {expiryDate || "---"}
                              </p>
                            </td>
                            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                              <p
                                className={`inline-flex capitalize rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium
                             ${status === "valid"
                                    ? "bg-success text-success"
                                    : status === "expired"
                                      ? "bg-danger text-danger"
                                      : status === "renewal" ? "bg-warning text-warning" : "bg-slate-500"
                                  }`}
                              >
                                {status}
                              </p>
                            </td>
                            <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                              <div className="flex items-center gap-1">
                                <button title="edit" onClick={() => handleEdit(_id)} className="hover:bg-primary rounded hover:bg-opacity-10 p-1">
                                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5.92971 19.283L5.92972 19.283L5.95149 19.2775L5.95151 19.2775L8.58384 18.6194C8.59896 18.6156 8.61396 18.6119 8.62885 18.6082C8.85159 18.5528 9.04877 18.5037 9.2278 18.4023C9.40683 18.301 9.55035 18.1571 9.71248 17.9947C9.72332 17.9838 9.73425 17.9729 9.74527 17.9618L16.9393 10.7678L16.9393 10.7678L16.9626 10.7445C17.2761 10.4311 17.5461 10.1611 17.7333 9.91573C17.9339 9.65281 18.0858 9.36038 18.0858 9C18.0858 8.63961 17.9339 8.34719 17.7333 8.08427C17.5461 7.83894 17.276 7.5689 16.9626 7.2555L16.9393 7.23223L16.5858 7.58579L16.9393 7.23223L16.7678 7.06066L16.7445 7.03738C16.4311 6.72395 16.1611 6.45388 15.9157 6.2667C15.6528 6.0661 15.3604 5.91421 15 5.91421C14.6396 5.91421 14.3472 6.0661 14.0843 6.2667C13.8389 6.45388 13.5689 6.72395 13.2555 7.03739L13.2322 7.06066L6.03816 14.2547C6.02714 14.2658 6.01619 14.2767 6.00533 14.2875C5.84286 14.4496 5.69903 14.5932 5.59766 14.7722C5.4963 14.9512 5.44723 15.1484 5.39179 15.3711C5.38809 15.386 5.38435 15.401 5.38057 15.4162L4.71704 18.0703C4.71483 18.0791 4.7126 18.088 4.71036 18.097C4.67112 18.2537 4.62921 18.421 4.61546 18.5615C4.60032 18.7163 4.60385 18.9773 4.81326 19.1867C5.02267 19.3961 5.28373 19.3997 5.43846 19.3845C5.57899 19.3708 5.74633 19.3289 5.90301 19.2896C5.91195 19.2874 5.92085 19.2852 5.92971 19.283Z" stroke="#3C50E0" />
                                    <path d="M12.5 7.5L15.5 5.5L18.5 8.5L16.5 11.5L12.5 7.5Z" fill="#3C50E0" />
                                  </svg>
                                </button>
                                <button title="delete" onClick={() => handleDelete(_id)} className="hover:bg-red rounded hover:bg-opacity-10 p-1">
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.5 14.5L9.5 11.5" stroke="#FB5454" strokeLinecap="round" />
                                    <path d="M14.5 14.5L14.5 11.5" stroke="#FB5454" strokeLinecap="round" />
                                    <path d="M3 6.5H21V6.5C19.5955 6.5 18.8933 6.5 18.3889 6.83706C18.1705 6.98298 17.983 7.17048 17.8371 7.38886C17.5 7.89331 17.5 8.59554 17.5 10V15.5C17.5 17.3856 17.5 18.3284 16.9142 18.9142C16.3284 19.5 15.3856 19.5 13.5 19.5H10.5C8.61438 19.5 7.67157 19.5 7.08579 18.9142C6.5 18.3284 6.5 17.3856 6.5 15.5V10C6.5 8.59554 6.5 7.89331 6.16294 7.38886C6.01702 7.17048 5.82952 6.98298 5.61114 6.83706C5.10669 6.5 4.40446 6.5 3 6.5V6.5Z" stroke="#FB5454" strokeLinecap="round" />
                                    <path d="M9.5 3.50024C9.5 3.50024 10 2.5 12 2.5C14 2.5 14.5 3.5 14.5 3.5" stroke="#FB5454" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>}
      </div>
    </DefaultLayout>
  );
};
export default SingleCompany;
