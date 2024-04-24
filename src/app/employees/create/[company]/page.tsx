"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const FormLayout = () => {
  const router = useRouter()
  const { company } = useParams()
  
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isOptionSelected, setIsOptionSelected] = useState<boolean>(false);
  const [employeeData, setEmployeeData] = useState<any>({ name: "",company });

  useEffect(() => {
    if (employeeData.isActive) {
      setIsOptionSelected(true);
    }
  }, [employeeData.isActive])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      await axios.post("/api/employee", employeeData)
      router.push("/company")
    } catch (error) {
      console.log(error)
    }
  }
  const handleAddDocument = (e: any) => {
    e.preventDefault()
    let documents = {
      name: "",
      issueDate: "",
      expiryDate: "",
      attachment: ""
    }
    if (!employeeData.documents) {
      setEmployeeData({ ...employeeData, documents: [documents] })
    }
    else {
      const updatedDocuments = [...employeeData.documents, documents];
      setEmployeeData({ ...employeeData, documents: updatedDocuments });
    }
  };
  const handleDocumentChange = (index: number, field: string, value: string | Date) => {
    const updatedDocuments = [...employeeData.documents];
    updatedDocuments[index][field] = value;
    setEmployeeData({ ...employeeData, documents: updatedDocuments });
  };
  const handleChange = (e: any) => {
    setEmployeeData({
      ...employeeData,
      [e.target.name]: e.target.value
    })
  }
  console.log(employeeData);

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Add Employee" />

      <form className="grid grid-cols-1 gap-9 sm:grid-cols-2 relative" action="#">

        <div className="flex flex-col gap-9">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Employee Details
              </h3>
            </div>
            <div className="p-6.5">
              <div className="mb-4.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Name <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={employeeData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter employee name"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Emirates ID
                  </label>
                  <input
                    type="text"
                    name="emiratesId"
                    value={employeeData?.emiratesId}
                    onChange={handleChange}
                    placeholder="Enter emirates id number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Nationality</label>
                  <input
                    type="text"
                    name="nationality"
                    value={employeeData?.nationality}
                    onChange={handleChange}
                    placeholder="Enter nationality"
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
                  name="email"
                  value={employeeData?.email}
                  onChange={handleChange}
                  placeholder="Enter email"
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
                    name="phone1"
                    value={employeeData?.phone1}
                    onChange={handleChange}
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
                    name="phone2"
                    value={employeeData?.phone2}
                    onChange={handleChange}
                    placeholder="Other phone number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

              </div>
              <div className="mb-4.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={employeeData?.designation}
                  onChange={handleChange}
                  placeholder="Enter designation"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Remarks
                </label>
                <textarea
                  rows={6}
                  name="remarks"
                  placeholder="Remarks Here"
                  value={employeeData?.remarks}
                  onChange={handleChange}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                ></textarea>
              </div>
              <button onClick={handleSubmit} className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
                Save Company
              </button>
            </div>
          </div>


        </div>

        <div className="flex flex-col gap-9">

          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Documents
              </h3>
            </div>
            <div className="px-6.5 pb-6.5">
              {employeeData?.documents?.map((doc: any, index: number) => (
                <div key={index} className="border-b border-stroke py-6.5 dark:border-strokedark">
                  <div className="mb-4.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Document Name <span className="text-meta-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={employeeData.documents[index]?.name}
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
                        name="issueDate"
                        value={employeeData.documents[index]?.issueDate}
                        onChange={(e) => handleDocumentChange(index, 'issueDate', e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                    <div className="w-full xl:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Expiry Date <span className="text-meta-1">*</span>
                      </label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={employeeData.documents[index]?.expiryDate}
                        onChange={(e) => handleDocumentChange(index, 'expiryDate', e.target.value)}
                        required
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
                      name="attachment"
                      value={employeeData.documents[index]?.attachment}
                      onChange={(e) => handleDocumentChange(index, 'attachment', e.target.value)}
                      className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:px-5 file:py-3 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
              ))}

              <button onClick={handleAddDocument} className="flex w-full justify-center rounded bg-green-700 p-3 font-medium text-gray hover:bg-opacity-90">
                Add Document                </button>
            </div>
          </div>
        </div>
      </form>
    </DefaultLayout>
  );
};

export default FormLayout;
