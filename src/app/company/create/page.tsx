"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const FormLayout = () => {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [companyData, setCompanyData] = useState<any>(
    {
      name: "",
      licenseNo: "",
      companyType: "",
      emirates: "",
      phone1: "",
      phone2: "",
      email: "",
      transactionNo: "",
      isMainland: "",
      remarks: "",
      password: [{
        platform: "",
        username: "",
        password: "",
      }],
      documents: [{
        name: "",
        issueDate: "",
        expiryDate: "",
        attachment: ""
      }]
    }

  );
  const [isOptionSelected, setIsOptionSelected] = useState<boolean>(false);

  const changeTextColor = () => {
    setIsOptionSelected(true);
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      await axios.post("/api/company", companyData)
      router.push("/company")
    } catch (error) {
      console.log(error)
    }
  }

  const handlePasswordChange = (index: number, field: string, value: string) => {
    const updatedPasswords = [...companyData.password];
    updatedPasswords[index][field] = value;
    setCompanyData({ ...companyData, password: updatedPasswords });
  };
  const handleAddPassword = (e: any) => {
    e.preventDefault()
    const updatedPasswords = [...companyData.password, {
      platform: "",
      username: "",
      password: "",
    }];
    setCompanyData({ ...companyData, password: updatedPasswords });
  };
  const handleAddDocument = (e: any) => {
    e.preventDefault()
    const updatedDocuments = [...companyData.documents, {
      name: "",
      issueDate: "",
      expiryDate: "",
      attachment: ""
    }];
    setCompanyData({ ...companyData, documents: updatedDocuments });
  };
  const handleDocumentChange = (index: number, field: string, value: string | Date) => {
    const updatedDocuments = [...companyData.documents];
    updatedDocuments[index][field] = value;
    setCompanyData({ ...companyData, documents: updatedDocuments });
  };
  console.log(companyData);
  
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Add Company" />

      <form className="grid grid-cols-1 gap-9 sm:grid-cols-2 relative" action="#">

        <div className="flex flex-col gap-9">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Company Details
              </h3>
            </div>
            <div className="p-6.5">
              <div className="mb-4.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Name <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  required
                  placeholder="Enter company name"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    License Number
                  </label>
                  <input
                    type="text"
                    onChange={(e) => setCompanyData({ ...companyData, licenseNo: e.target.value })}
                    placeholder="Enter license number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Company Type</label>
                  <input
                    type="text"
                    onChange={(e) => setCompanyData({ ...companyData, companyType: e.target.value })}
                    placeholder="Enter company type"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>

              <div className="mb-4.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Email
                </label>
                <input
                  type="email"
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  placeholder="Enter company Email"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    onChange={(e) => setCompanyData({ ...companyData, phone1: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Phone Number 2
                  </label>
                  <input
                    type="text"
                    onChange={(e) => setCompanyData({ ...companyData, phone2: e.target.value })}
                    placeholder="Other phone number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

              </div>
              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Emirates/Area
                  </label>
                  <input
                    type="text"
                    onChange={(e) => setCompanyData({ ...companyData, emirates: e.target.value })}
                    placeholder="Enter emirates name"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Transaction Number                    </label>
                  <input
                    type="text"
                    onChange={(e) => setCompanyData({ ...companyData, transactionNo: e.target.value })}
                    placeholder="Transaction Number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

              </div>



              <div className="mb-4.5">

                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Mainland/Freezone
                </label>

                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select
                    value={selectedOption}
                    onChange={(e) => {
                      setSelectedOption(e.target.value);
                      changeTextColor();
                      setCompanyData({ ...companyData, isMainland: e.target.value })

                    }}
                    className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${isOptionSelected ? "text-black dark:text-white" : ""
                      }`}
                  >
                    <option value="" disabled className="text-body dark:text-bodydark">
                      Select any one
                    </option>
                    <option value="mainland" className="text-body dark:text-bodydark">
                      Mainland
                    </option>
                    <option value="freezone" className="text-body dark:text-bodydark">
                      Freezone
                    </option>
                  </select>

                  <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
                    <svg
                      className="fill-current"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g opacity="0.8">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                          fill=""
                        ></path>
                      </g>
                    </svg>
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Remarks
                </label>
                <textarea
                  rows={6}
                  placeholder="Remarks Here"
                  onChange={(e) => setCompanyData({ ...companyData, remarks: e.target.value })}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                ></textarea>
              </div>
              <button onClick={handleSubmit} className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
                Save Company
              </button>
            </div>
          </div>
          {/* <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Company Owner Details
              </h3>
            </div>
            <div className="p-6.5">
              <div className="mb-4.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Name
                </label>
                <input
                  type="text"
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  required
                  placeholder="Enter owner name"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    License Number
                  </label>
                  <input
                    type="text"
                    onChange={(e) => setCompanyData({ ...companyData, licenseNo: e.target.value })}
                    placeholder="Enter license number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Company Type</label>
                  <input
                    type="text"
                    onChange={(e) => setCompanyData({ ...companyData, companyType: e.target.value })}
                    placeholder="Enter company type"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>



            </div>
          </div> */}



        </div>

        <div className="flex flex-col gap-9">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Usernames and Passwords
              </h3>
            </div>
            <div className="px-6.5 pb-6.5">
              {companyData.password.map((item: any, index: number) => (
                <div key={index} className="border-b border-stroke py-6.5 dark:border-strokedark">
                  <div className="mb-4.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Platform
                    </label>
                    <input
                      type="text"
                      placeholder="Enter platform name"
                      onChange={(e) => handlePasswordChange(index, 'platform', e.target.value)}
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>

                  <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                    <div className="w-full xl:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Username
                      </label>
                      <input
                        type="text"
                        onChange={(e) => handlePasswordChange(index, 'username', e.target.value)}
                        placeholder="Enter username"
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                    <div className="w-full xl:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Password
                      </label>
                      <input
                        type="text"
                        name="password"
                        onChange={(e) => handlePasswordChange(index, 'password', e.target.value)}
                        placeholder="Enter the password"
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>

                  </div>


                </div>

              ))}
              <button onClick={handleAddPassword} className="flex w-full justify-center rounded bg-green-700 p-3 font-medium text-gray hover:bg-opacity-90">
                Add Another Platform
              </button>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Documents
              </h3>
            </div>
            <div className="px-6.5 pb-6.5">
              {companyData.documents.map((doc: any, index: number) => (
                <div key={index} className="border-b border-stroke py-6.5 dark:border-strokedark">
                  <div className="mb-4.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Document Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
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
                        onChange={(e) => handleDocumentChange(index, 'issueDate', e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                    <div className="w-full xl:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        onChange={(e) => handleDocumentChange(index, 'expiryDate', e.target.value)}
                        placeholder="Enter the password"
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>

                  </div>





                  <div className="mb-4.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Attach file
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleDocumentChange(index, 'attachment', e.target.value)}
                      className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:px-5 file:py-3 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
              ))}

              <button onClick={handleAddDocument} className="flex w-full justify-center rounded bg-green-700 p-3 font-medium text-gray hover:bg-opacity-90">
                Add Another Document                </button>
            </div>
          </div>
        </div>
      </form>
    </DefaultLayout>
  );
};

export default FormLayout;
