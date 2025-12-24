"use client";
import clsx from "clsx";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useRouter } from "next/navigation";
import { TBaseData } from "@/types/types";
import { useEffect, useState } from "react";
import { capitalize, debounce } from "lodash";
import { useUserContext } from "@/contexts/UserContext";
import { TRecordData } from "@/types/records";
import { useParams } from "next/navigation";
import { searchCompaniesAction, searchEmployeesAction, getCompanyBalanceAction, getEmployeeBalanceAction } from "@/actions/company-employee";
import { getPrevSuffixNumberAction, getRecordAction, createRecordAction, updateRecordAction, createInstantProfitAction } from "@/actions/payment";

const AddRecord = ({ type, edit }: { type: string; edit?: boolean }) => {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useUserContext();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<TBaseData[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [clientFee, setClientFee] = useState<string>("");
  const [balance, setBalance] = useState(0);
  const [clientType, setClientType] = useState("");
  const [recordData, setRecordData] = useState<TRecordData>({
    createdBy: user?._id,
    type,
    amount: 0,
    invoiceNo: "",
    particular: "",
    remarks: "",
    number: 0,
    suffix: "",
  });

  useEffect(() => {
    if (selectedOption === "self")
      setRecordData({
        ...recordData,
        self: "zaad",
        company: undefined,
        employee: undefined,
      });
  }, [selectedOption]);

  useEffect(() => {
    if (clientFee !== "") {
      const newServiceFee = parseFloat(clientFee) - recordData.amount;
      setRecordData((prevData) => ({ ...prevData, serviceFee: newServiceFee }));
    }
  }, [recordData.amount]);

  const generateServiceFee = (e: any) => {
    const newClientFee = e.target.value;
    const newServiceFee = newClientFee - recordData.amount;
    setClientFee(newClientFee);
    setRecordData({ ...recordData, serviceFee: newServiceFee });
  };

  const fetchsearchSuggestions = async (
    inputValue: string,
    inputName: string
  ) => {
    try {
      if (inputValue.length > 0) {
        setClientType(inputName);
        const response = inputName === "company" 
          ? await searchCompaniesAction(inputValue)
          : await searchEmployeesAction(inputValue);
        setSearchSuggestions(response);
      }
    } catch (error) {
      console.error("Error fetching company suggestions:", error);
    }
  };

  const debounceSearch = debounce((input: string, name: string) => {
    fetchsearchSuggestions(input, name);
  }, 300);

  const handleInputChange = (e: any) => {
    setSearchValue(e.target.value);
    const inputName = e.target.name;
    debounceSearch(searchValue, inputName);
  };

  const fetchBalance = async (Id?: string) => {
    try {
      const response = clientType === "company"
        ? await getCompanyBalanceAction(Id)
        : await getEmployeeBalanceAction(Id);
      setBalance(response.balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };
  const fetchPrev = async (Id?: string) => {
    try {
      if (!edit) {
        const data = await getPrevSuffixNumberAction();
        setRecordData({
          ...recordData,
          number: +data?.number + 1,
          suffix: data?.suffix,
        });
      } else {
        const data = await getRecordAction(id as string);
        setRecordData(data as any);
        setSelectedMethod((data as any).method);
        setSelectedStatus((data as any).status)
        if ((data as any).type === "expense") {
          setClientFee((data as any).amount + (data as any).serviceFee)
        }
      }
    } catch (error) {
      console.error("Error fetching", error);
    }
  };

  const handleCompanySelection = (selected: TBaseData) => {
    setSearchValue(selected.name);
    setRecordData({
      ...recordData,
      employee: undefined,
      company: selected._id,
      self: undefined,
    });
    setSearchSuggestions([]);
    fetchBalance(selected._id);
  };

  const handleEmployeeSelection = (selected: TBaseData) => {
    setSearchValue(selected.name);
    setRecordData({
      ...recordData,
      company: undefined,
      employee: selected._id,
      self: undefined,
    });
    setSearchSuggestions([]);
    fetchBalance(selected._id);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    switch (true) {
      case !recordData.company && !recordData.employee && !recordData.self:
        alert("Please select a client from any type");
        return;
      case !recordData.particular:
        alert("Please fill in the particular.");
        return;
      case !recordData.method:
        alert("Please select a payment method.");
        return;
      case !recordData.number:
        alert("Please enter a transaction number.");
        return;
      default:
        break;
    }
    try {
      if (!edit) {
        if (recordData?.status === "Profit") {
          await createInstantProfitAction(recordData);
        } else {
          await createRecordAction(recordData);
        }
      } else {
        await updateRecordAction(id as string, recordData);
      }
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

  useEffect(() => {
    fetchPrev();
  }, []);

  return (
    <DefaultLayout>
      <Breadcrumb pageName={"Add " + capitalize(recordData?.type)} />

      <form className="relative" action="#">
        <div className="flex flex-col gap-9">
          <div
            className={`rounded-sm border ${type === "income" ? "border-meta-3" : type === "expense" ? "border-red" : "border-stroke dark:border-strokedark"} bg-white shadow-default  dark:bg-boxdark`}
          >
            <div className="p-6.5">
              {!edit && (
                <div className="mb-4.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Client Type
                    <span className="text-meta-1">*</span>
                  </label>

                  <div className="relative z-20 bg-transparent dark:bg-form-input">
                    <select
                      title="client type"
                      value={selectedOption}
                      name="client-type"
                      onChange={(e) => {
                        setSelectedOption(e.target.value);
                      }}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    >
                      <option
                        value=""
                        disabled
                        className="text-body dark:text-bodydark"
                      >
                        Select any one
                      </option>
                      <option
                        value="company"
                        className="text-body dark:text-bodydark"
                      >
                        Company
                      </option>
                      <option
                        value="employee"
                        className="text-body dark:text-bodydark"
                      >
                        Individual
                      </option>
                      <option
                        value="self"
                        className="text-body dark:text-bodydark"
                      >
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
              )}
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
                          key={key}
                          onClick={() => handleEmployeeSelection(employee)}
                        >
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
                          key={key}
                          onClick={() => handleCompanySelection(company)}
                        >
                          {company.name}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Particular
                </label>
                <input
                  type="text"
                  name="particular"
                  required={true}
                  value={recordData?.particular}
                  onChange={handleChange}
                  placeholder="Enter particular"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Transaction Suffix
                  </label>
                  <input
                    type="text"
                    name="suffix"
                    value={recordData?.suffix}
                    onChange={handleChange}
                    placeholder="Enter a suffix"
                    className="w-full uppercase rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Transaction Number
                  </label>
                  <input
                    type="number"
                    name="number"
                    onWheel={(e: any) => e.target.blur()}
                    value={recordData?.number}
                    onChange={handleChange}
                    placeholder="Invoice number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    name="invoiceNo"
                    value={recordData?.invoiceNo}
                    onChange={handleChange}
                    placeholder="Enter invoice number"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>
              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Method
                    <span className="text-meta-1">*</span>
                  </label>

                  <div className="relative z-20 bg-transparent dark:bg-form-input">
                    <select
                      value={selectedMethod}
                      name="method"
                      title="method"
                      onChange={(e) => {
                        setSelectedMethod(e.target.value);
                        setRecordData({
                          ...recordData,
                          method: e.target.value,
                        });
                      }}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    >
                      <option
                        value=""
                        disabled
                        className="text-body dark:text-bodydark"
                      >
                        Select any status
                      </option>
                      <option
                        value="bank"
                        className="text-body dark:text-bodydark"
                      >
                        Bank
                      </option>
                      <option
                        value="cash"
                        className="text-body dark:text-bodydark"
                      >
                        Cash
                      </option>
                      <option
                        value="tasdeed"
                        className="text-body dark:text-bodydark"
                      >
                        Tasdeed{" "}
                      </option>
                      <option
                        value="swiper"
                        className="text-body dark:text-bodydark"
                      >
                        Swiper{" "}
                      </option>
                      {type === "income" && (
                        <option
                          value="liability"
                          className="text-body dark:text-bodydark"
                        >
                          Liability{" "}
                        </option>
                      )}
                      {type === "expense" && (
                        <option
                          value="service fee"
                          className="text-body dark:text-bodydark"
                        >
                          Service Fee{" "}
                        </option>
                      )}
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
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Amount
                  </label>
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
                      <span
                        className={`text-xs border ${balance >= 0 ? "text-meta-3" : "text-red"} rounded-md bg-opacity-10 px-2 py-0.5 ml-2`}
                      >
                        Balance : {balance?.toFixed(2)}
                      </span>
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

                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Payment Status
                    <span className="text-meta-1">*</span>
                  </label>

                  <div className="relative z-20 bg-transparent dark:bg-form-input">
                    <select
                      title="payment status"
                      value={selectedStatus}
                      name="payment-status"
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setRecordData({
                          ...recordData,
                          status: e.target.value,
                        });
                      }}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    >
                      <option
                        value=""
                        disabled
                        className="text-body dark:text-bodydark"
                      >
                        Select any status
                      </option>
                      {selectedOption === "self" && (
                        <option
                          value="Self Deposit"
                          className="text-body dark:text-bodydark"
                        >
                          Self Deposit
                        </option>
                      )}
                      {type === "income" && (
                        <>
                          <option
                            value="Advance"
                            className="text-body dark:text-bodydark"
                          >
                            Advance
                          </option>
                          <option
                            value="Credit"
                            className="text-body dark:text-bodydark"
                          >
                            Credit (Income)
                          </option>
                          <option
                            value="Ready Cash"
                            className="text-body dark:text-bodydark"
                          >
                            Ready Cash
                          </option>
                          <option
                            value="Profit"
                            className="text-body dark:text-bodydark"
                          >
                            Instant Profit
                          </option>
                        </>
                      )}
                      {type === "expense" && (
                        <>
                          <option
                            value="Debit"
                            className="text-body dark:text-bodydark"
                          >
                            Debit (Pay Out)
                          </option>
                          <option
                            value="liability"
                            className="text-body dark:text-bodydark"
                          >
                            Liability Payment
                          </option>
                        </>
                      )}
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
              <button
                onClick={handleSubmit}
                className={clsx(
                  recordData.type === "income" ? "bg-green-700" : "bg-red",
                  "flex w-full justify-center rounded p-3 font-medium text-gray hover:bg-opacity-90"
                )}
              >
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
