"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";
import { TRecordData } from "@/types/records";
import { TBaseData } from "@/types/types";
import axios from "axios";
import clsx from "clsx";
import { capitalize, debounce } from "lodash";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiChevronDown, FiUserPlus, FiBriefcase, FiDollarSign, FiFileText, FiHash, FiCheckCircle } from "react-icons/fi";
import EntityAvatar from "../common/EntityAvatar";

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
        const response = await axios.get<TBaseData[]>(
          `/api/${inputName}/search/${inputValue}`
        );
        setSearchSuggestions(response.data);
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
    debounceSearch(e.target.value, inputName);
  };

  const fetchBalance = async (Id?: string) => {
    try {
      const response = await axios.get<{ balance: number }>(
        `/api/${clientType}/balance/${Id}`
      );
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };
  
  const fetchPrev = async (Id?: string) => {
    try {
      if (!edit) {
        const { data } = await axios.get<{ number: number; suffix: string }>(
          "/api/payment/prev"
        );
        setRecordData({
          ...recordData,
          number: +data?.number + 1,
          suffix: data?.suffix,
        });
      } else {
        const { data } = await axios.get(`/api/payment/${id}`);
        setRecordData(data);
        setSelectedMethod(data.method);
        setSelectedStatus(data.status)
        if (data.type === "expense") {
          setClientFee(data.amount + data.serviceFee)
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
          await axios.post("/api/payment/profit", recordData);
        } else {
          await axios.post("/api/payment", recordData);
        }
      } else {
        await axios.put(`/api/payment/${id}`, recordData);
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

  useEffect(() => {
    fetchPrev();
  }, []);

  const inputClass = "w-full appearance-none rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900";
  const labelClass = "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";
  
  const themeColor = type === "income" ? "emerald" : "rose";
  const themeBorder = type === "income" ? "border-emerald-500/50 hover:border-emerald-500 ring-emerald-500/20" : "border-rose-500/50 hover:border-rose-500 ring-rose-500/20";
  const buttonBg = type === "income" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30";

  return (
    <>
      <Breadcrumb pageName={(edit ? "Edit " : "Add ") + capitalize(recordData?.type)} />

      <form className="relative mx-auto max-w-4xl" action="#">
        <div className="flex flex-col gap-9">
          <div className={clsx("rounded-2xl border bg-white shadow-sm ring-1 transition-all duration-300 dark:bg-slate-900/50", themeBorder)}>
            
            {/* Header Area */}
            <div className={clsx("rounded-t-2xl border-b p-6 sm:p-8", type === "income" ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-500/5" : "border-rose-100 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-500/5")}>
               <h3 className={clsx("text-xl font-bold flex items-center gap-2", type === "income" ? "text-emerald-800 dark:text-emerald-400" : "text-rose-800 dark:text-rose-400")}>
                  {type === "income" ? <FiCheckCircle /> : <FiDollarSign />} 
                  {edit ? "Edit Record Details" : "New Transaction Record"}
               </h3>
               <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                 Complete all the required fields below to firmly register this {type} into the accounting ledger.
               </p>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {!edit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>
                      Client Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative z-20">
                      <select
                        title="client type"
                        value={selectedOption}
                        name="client-type"
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className={inputClass}
                      >
                        <option value="" disabled>Select any one</option>
                        <option value="company">Company</option>
                        <option value="employee">Individual</option>
                        <option value="self">ZAAD Self</option>
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <FiChevronDown />
                      </span>
                    </div>
                  </div>
                  
                  {/* Dynamic Fields based on Client Type */}
                  {selectedOption === "employee" && (
                    <div className="relative">
                      <label className={labelClass}>Individual Name</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <FiUserPlus />
                        </span>
                        <input
                          type="text"
                          name="employee"
                          onChange={handleInputChange}
                          value={searchValue}
                          autoComplete="off"
                          placeholder="Search individual..."
                          className={clsx(inputClass, "pl-11")}
                        />
                      </div>
                      {searchSuggestions.length > 0 && (
                        <ul className="absolute z-30 mt-2 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          {searchSuggestions.map((employee, key) => (
                            <li
                              className="cursor-pointer px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-700"
                              key={key}
                              onClick={() => handleEmployeeSelection(employee)}
                            >
                              <div className="flex items-center gap-3">
                                <EntityAvatar name={employee.name} color={employee.color} size="sm" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{employee.name}</span>
                                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Individual</span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {selectedOption === "company" && (
                    <div className="relative">
                      <label className={labelClass}>Company Name</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <FiBriefcase />
                        </span>
                        <input
                          type="text"
                          name="company"
                          value={searchValue}
                          autoComplete="off"
                          onChange={handleInputChange}
                          placeholder="Search company..."
                          className={clsx(inputClass, "pl-11")}
                        />
                      </div>
                      {searchSuggestions.length > 0 && (
                        <ul className="absolute z-30 mt-2 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          {searchSuggestions.map((company, key) => (
                            <li
                              className="cursor-pointer px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-700"
                              key={key}
                              onClick={() => handleCompanySelection(company)}
                            >
                              <div className="flex items-center gap-3">
                                <EntityAvatar name={company.name} color={company.color} size="sm" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{company.name}</span>
                                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Company</span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className={labelClass}>Particular / Purpose</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <FiFileText />
                  </span>
                  <input
                    type="text"
                    name="particular"
                    required={true}
                    value={recordData?.particular}
                    onChange={handleChange}
                    placeholder="E.g., Salary payment, Consultation fee..."
                    className={clsx(inputClass, "pl-11")}
                  />
                </div>
              </div>

              {/* Transaction Context Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Transaction Suffix</label>
                  <input
                    type="text"
                    name="suffix"
                    value={recordData?.suffix}
                    onChange={handleChange}
                    placeholder="e.g. TRN-"
                    className={clsx(inputClass, "uppercase")}
                  />
                </div>
                <div>
                  <label className={labelClass}>Transaction Number</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FiHash />
                    </span>
                    <input
                      type="number"
                      name="number"
                      onWheel={(e: any) => e.target.blur()}
                      value={recordData?.number}
                      onChange={handleChange}
                      placeholder="000"
                      className={clsx(inputClass, "pl-11")}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Invoice Number</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FiHash />
                    </span>
                    <input
                      type="text"
                      name="invoiceNo"
                      value={recordData?.invoiceNo}
                      onChange={handleChange}
                      placeholder="INV-..."
                      className={clsx(inputClass, "pl-11")}
                    />
                  </div>
                </div>
              </div>

              {/* Financial Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative z-20">
                    <select
                      value={selectedMethod}
                      name="method"
                      title="method"
                      onChange={(e) => {
                        setSelectedMethod(e.target.value);
                        setRecordData({ ...recordData, method: e.target.value });
                      }}
                      className={inputClass}
                    >
                      <option value="" disabled>Select Method</option>
                      <option value="bank">Bank</option>
                      <option value="cash">Cash</option>
                      <option value="tasdeed">Tasdeed</option>
                      <option value="swiper">Swiper</option>
                      {type === "income" && <option value="liability">Liability</option>}
                      {type === "expense" && <option value="service fee">Service Fee</option>}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <FiChevronDown />
                    </span>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Amount (AED)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FiDollarSign />
                    </span>
                    <input
                      type="number"
                      name="amount"
                      value={recordData?.amount}
                      onWheel={(e: any) => e.target.blur()}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={clsx(inputClass, "pl-11 font-semibold")}
                    />
                  </div>
                </div>

                {type === "expense" && (
                  <div>
                    <label className={labelClass}>
                      Client Fee
                      <span className={clsx("ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", balance >= 0 ? "bg-emerald-50 text-emerald-600 ring-emerald-500/20" : "bg-rose-50 text-rose-600 ring-rose-500/20")}>
                        Bal: {balance?.toFixed(2)}
                      </span>
                    </label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <FiDollarSign />
                      </span>
                      <input
                        type="number"
                        name="clientFee"
                        value={clientFee}
                        onWheel={(e: any) => e.target.blur()}
                        placeholder="0.00"
                        onChange={generateServiceFee}
                        className={clsx(inputClass, "pl-11")}
                      />
                    </div>
                  </div>
                )}

                <div className={type === "expense" ? "md:col-span-2 lg:col-span-3" : ""}>
                   <label className={labelClass}>
                    Payment Status <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative z-20">
                    <select
                      title="payment status"
                      value={selectedStatus}
                      name="payment-status"
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setRecordData({ ...recordData, status: e.target.value });
                      }}
                       className={inputClass}
                    >
                      <option value="" disabled>Select Status</option>
                      {selectedOption === "self" && <option value="Self Deposit">Self Deposit</option>}
                      {type === "income" && (
                        <>
                          <option value="Advance">Advance</option>
                          <option value="Credit">Credit (Income)</option>
                          <option value="Ready Cash">Ready Cash</option>
                          <option value="Profit">Instant Profit</option>
                        </>
                      )}
                      {type === "expense" && (
                        <>
                          <option value="Debit">Debit (Pay Out)</option>
                          <option value="liability">Liability Payment</option>
                        </>
                      )}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <FiChevronDown />
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Remarks</label>
                <textarea
                  rows={4}
                  name="remarks"
                  placeholder="Optional details or notes regarding this transaction..."
                  value={recordData?.remarks}
                  onChange={handleChange}
                  className={clsx(inputClass, "resize-y")}
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleSubmit}
                  className={clsx(
                    buttonBg,
                     "flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
                     type === "income" ? "focus:ring-emerald-500" : "focus:ring-rose-500"
                  )}
                >
                  {type === "income" ? <FiCheckCircle className="text-xl" /> : <FiDollarSign className="text-xl" />}
                  {edit ? "Save Changes" : `Add ${capitalize(recordData?.type)}`}
                </button>
              </div>

            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddRecord;
