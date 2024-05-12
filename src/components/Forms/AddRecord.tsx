"use client"
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { TSuggestions } from "@/types/types";
import { useEffect, useState } from "react";
import { debounce } from "lodash";
import axios from "axios";
import clsx from "clsx";
import { useUserContext } from "@/contexts/UserContext";
import { TRecordData } from "@/types/records";

const AddRecord = ({ type }: { type: string }) => {
  const router = useRouter();
  const { user } = useUserContext();
  console.log(user)
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<TSuggestions[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [clientFee, setClientFee] = useState<string>("");
  const [recordData, setRecordData] = useState<TRecordData>({
    createdBy: user?._id,
    type,
    amount: 0,
    invoiceNo: "",
    particular: "",
    remarks: "",
  });

  useEffect(() => {
    if (selectedOption === "self")
      setRecordData({ ...recordData, self: "zaad", company: undefined, employee: undefined })
  }, [selectedOption])


  const generateServiceFee = (e: any) => {
    const newClientFee = e.target.value
    const newServiceFee = newClientFee - recordData.amount
    setClientFee(newClientFee)
    setRecordData({ ...recordData, serviceFee: newServiceFee })

  }
  const fetchsearchSuggestions = async (inputValue: string, inputName: string) => {
    try {
      const response = await axios.get<TSuggestions[]>(`/api/${inputName}/search/${inputValue}`);
      setSearchSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching company suggestions:", error);
    }
  };

  const debounceSearch = debounce((input: string, name: string) => {
    fetchsearchSuggestions(input, name);
  }, 300);

  const handleInputChange = (e: any) => {
    setSearchValue(e.target.value)
    const inputName = e.target.name;
    debounceSearch(searchValue, inputName);
  };


  const handleCompanySelection = (selected: TSuggestions) => {
    setSearchValue(selected.name)
    setRecordData({ ...recordData, employee: undefined, company: selected._id });
    setSearchSuggestions([])
  };
  const handleEmployeeSelection = (selected: TSuggestions) => {
    setSearchValue(selected.name)
    setRecordData({ ...recordData, company: undefined, employee: selected._id });
    setSearchSuggestions([])
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post("/api/payment", recordData);
      router.push("/accounts/transactions");
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setRecordData({ ...recordData, [name]: value });
  };

  console.log(recordData);

  return (
    <DefaultLayout>
      <Breadcrumb pageName={"Add " + recordData?.type} />

      <form className="relative" action="#">

        <div className="flex flex-col gap-9">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

            <div className="p-6.5">
              <div className="mb-4.5">

                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Client Type
                  <span className="text-meta-1">*</span>
                </label>

                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select
                    value={selectedOption}
                    name="client-type"
                    onChange={(e) => {
                      setSelectedOption(e.target.value);
                    }}
                    className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"

                  >
                    <option value="" disabled className="text-body dark:text-bodydark">
                      Select any one
                    </option>
                    <option value="company" className="text-body dark:text-bodydark">
                      Company
                    </option>
                    <option value="employee" className="text-body dark:text-bodydark">
                      Individual
                    </option>
                    <option value="self" className="text-body dark:text-bodydark">
                      ZAAD
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
                      Individual Name
                    </label>
                    <input
                      type="text"
                      name="employee"
                      onChange={handleInputChange}
                      value={searchValue}
                      autoComplete="off"
                      placeholder="Enter individual name"
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                    <ul className="flex flex-wrap gap-1 mt-2">
                      {searchSuggestions.map((employee, key) => (
                        <li
                          className="rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary cursor-pointer dark:hover:bg-primary hover:border-primary"
                          key={key} onClick={() => handleEmployeeSelection(employee)}>
                          {employee.name}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {selectedOption === "company" && (
                  <>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={searchValue}
                      autoComplete="off"
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                    <ul className="flex flex-wrap gap-1 mt-2">
                      {searchSuggestions.map((company, key) => (
                        <li

                          className="rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary cursor-pointer dark:hover:bg-primary hover:border-primary"

                          key={key} onClick={() => handleCompanySelection(company)}>
                          {company.name}
                        </li>
                      ))}
                    </ul>
                  </>
                )}


              </div>

              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">Invoice Number</label>
                  <input
                    type="text"
                    name="invoiceNo"
                    value={recordData?.invoiceNo}
                    onChange={handleChange}
                    placeholder="Enter invoice number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">Particular</label>
                  <input
                    type="text"
                    name="particular"
                    value={recordData?.particular}
                    onChange={handleChange}
                    placeholder="Select particular"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>
              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">

                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Payment Method
                    <span className="text-meta-1">*</span>
                  </label>

                  <div className="relative z-20 bg-transparent dark:bg-form-input">
                    <select
                      value={selectedMethod}
                      name="method"
                      onChange={(e) => {
                        setSelectedMethod(e.target.value);
                        setRecordData({ ...recordData, method: e.target.value })
                      }}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"

                    >
                      <option value="" disabled className="text-body dark:text-bodydark">
                        Select any status
                      </option>
                      <option value="bank" className="text-body dark:text-bodydark">
                        Bank
                      </option>
                      <option value="cash" className="text-body dark:text-bodydark">
                        Cash
                      </option>
                      <option value="tasdeed" className="text-body dark:text-bodydark">
                        Tasdeed                      </option>
                      <option value="swiper" className="text-body dark:text-bodydark">
                        Swiper                      </option>
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
                          ></path>
                        </g>
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={recordData?.amount}
                    onWheel={(e: any) => e.target.blur()}
                    onChange={handleChange}
                    placeholder="Enter Amount"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                {type === "expense" && (
                  <div className="w-full xl:w-1/2">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Client Fee
                    </label>
                    <input
                      type="number"
                      name="clientFee"
                      value={clientFee}
                      onWheel={(e: any) => e.target.blur()}
                      placeholder="Enter client fee"
                      onChange={generateServiceFee}
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                )}
                {type === "income" && (
                  <div className="w-full xl:w-1/2">

                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Payment Status
                      <span className="text-meta-1">*</span>
                    </label>

                    <div className="relative z-20 bg-transparent dark:bg-form-input">
                      <select
                        value={selectedStatus}
                        name="payment-status"
                        onChange={(e) => {
                          setSelectedStatus(e.target.value);
                          setRecordData({ ...recordData, status: e.target.value })
                        }}
                        className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"

                      >
                        <option value="" disabled className="text-body dark:text-bodydark">
                          Select any status
                        </option>
                        <option value="Advance" className="text-body dark:text-bodydark">
                          Advance
                        </option>
                        <option value="Credit" className="text-body dark:text-bodydark">
                          Credit
                        </option>
                        <option value="Ready Cash" className="text-body dark:text-bodydark">
                          Ready Cash
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
                            ></path>
                          </g>
                        </svg>
                      </span>
                    </div>
                  </div>
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
                  value={recordData?.remarks}
                  onChange={handleChange}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                ></textarea>
              </div>
              <button onClick={handleSubmit} className={clsx(recordData.type === "income" ? "bg-green-700" : 'bg-red', "flex w-full justify-center rounded p-3 font-medium text-gray hover:bg-opacity-90")}>
                Add {recordData?.type}
              </button>
            </div>
          </div>


        </div>

      </form>
    </DefaultLayout>
  );
};

export default AddRecord;
