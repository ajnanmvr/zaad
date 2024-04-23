"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const FormLayout = () => {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isOptionSelected, setIsOptionSelected] = useState<boolean>(false);
  const [incomeData, setIncomeData] = useState<any>({ type: "income", cash: 0, bank: 0, swiper: 0, tasdeed: 0 });

  let total = +incomeData.cash + +incomeData.swiper + +incomeData.tasdeed + +incomeData.bank

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      await axios.post("/api/company", incomeData)
      router.push("/company")
    } catch (error) {
      console.log(error)
    }
  }

  const handleChange = (e: any) => {
    setIncomeData({
      ...incomeData,
      [e.target.name]: e.target.value
    })


  }
  console.log(incomeData);

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Add Income" />

      <form className=" relative" action="#">

        <div className="flex flex-col gap-9">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b flex justify-between border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Transaction Details
              </h3>
              <p className="text-meta-3">AED {total}</p>

            </div>
            <div className="p-6.5">
              <div className="mb-4.5">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={incomeData.title}
                  onChange={handleChange}
                  placeholder="Enter record title"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Invoice Number                  </label>
                  <input
                    type="text"
                    name="invoiceNo"
                    value={incomeData?.invoiceNo}
                    onChange={handleChange}
                    placeholder="Enter invoice number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Particular</label>
                  <input
                    type="text"
                    name="particular"
                    value={incomeData?.particular}
                    onChange={handleChange}
                    placeholder="Select particular"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>
              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Cash                  </label>
                  <input
                    type="number"
                    name="cash"
                    value={incomeData?.cash}
                    onChange={handleChange}
                    placeholder="Enter cash"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Bank amount
                  </label>
                  <input
                    type="number"
                    name="bank"
                    value={incomeData?.bank}
                    onChange={handleChange}
                    placeholder="Enter bank amount"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Tasdeed
                  </label>
                  <input
                    type="number"
                    name="tasdeed"
                    value={incomeData?.tasdeed}
                    onChange={handleChange}
                    placeholder="Enter tasdeed"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Swiper amount
                  </label>
                  <input
                    type="number"
                    name="swiper"
                    value={incomeData?.swiper}
                    onChange={handleChange}
                    placeholder="Swiper amount"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

              </div>
              <div className="mb-4.5">

                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Client Type    <span className="text-meta-1">*</span>             </label>

                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select
                    value={selectedOption}
                    name="client-type"
                    onChange={(e) => {
                      setSelectedOption(e.target.value);
                    }}
                    className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${isOptionSelected ? "text-black dark:text-white" : ""
                      }`}
                  >
                    <option value="" disabled className="text-body dark:text-bodydark">
                      Select any one
                    </option>
                    <option value="company" className="text-body dark:text-bodydark">
                      Company
                    </option>
                    <option value="employee" className="text-body dark:text-bodydark">
                      Employee
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
              <div className="mb-4.5">



                {selectedOption === "employee" && (
                  <>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Employee Name
                    </label>
                    <input
                      type="text"
                      name="employee"
                      value={incomeData?.employee}
                      onChange={handleChange}
                      placeholder="Enter employee name"
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    /></>
                )}

                {selectedOption === "company" && (
                  <>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={incomeData?.company}
                      onChange={handleChange}
                      placeholder="Enter company name"
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    /></>
                )}


              </div>




              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Remarks
                </label>
                <textarea
                  rows={6}
                  name="remarks"
                  placeholder="Remarks Here"
                  value={incomeData?.remarks}
                  onChange={handleChange}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                ></textarea>
              </div>
              <button onClick={handleSubmit} className="flex w-full justify-center rounded bg-green-700 p-3 font-medium text-gray hover:bg-opacity-90">
                Add Income
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
                  onChange={(e) => setIncomeData({ ...incomeData, name: e.target.value })}
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
                    onChange={(e) => setIncomeData({ ...incomeData, licenseNo: e.target.value })}
                    placeholder="Enter license number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Company Type</label>
                  <input
                    type="text"
                    onChange={(e) => setIncomeData({ ...incomeData, particular: e.target.value })}
                    placeholder="Enter company type"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>



            </div>
          </div> */}



        </div>

      </form>
    </DefaultLayout>
  );
};

export default FormLayout;
