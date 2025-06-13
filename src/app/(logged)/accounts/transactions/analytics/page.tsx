"use client";
import React, { useRef } from "react";
import ChartOne from "@/components/Charts/ChartOne";
import ChartTwo from "@/components/Charts/ChartTwo";
import CardDataStats from "@/components/CardDataStats";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import { useState } from "react";
import Link from "next/link";
import ReactToPrint from "react-to-print";
import ReportPage from "@/components/ReportPage";
import { TAccountsData, TProfitsData } from "@/types/dashboard";
import { useQuery } from "@tanstack/react-query";
const baseData = {
  y: "", m: ""
}
export default function AccountsDashboard() {
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isPrint, setIsPrint] = useState(false);
  const [filterDummy, setFilterDummy] = useState({ ...baseData });
  const [filter, setFilter] = useState({ ...baseData });
  const componentRef = useRef(null)

  const generateQuery = (filter: { m: string; y: string }) => {
    let query = "";

    if (filter.m !== "current" && filter.m && filter.y) {
      query = `?m=${filter.m}&y=${filter.y}`;
    } else if (!filter.m && filter.y) {
      query = `?y=${filter.y}`;
    } else if (filter.m && filter.m !== "current") {
      query = `?m=${filter.m}`;
    } else if (filter.m === "current") {
      query = `?m=current`;
    }
    return query;
  };

  const { data: accountsData, isLoading: accountsLoading } = useQuery<TAccountsData>({
    queryKey: ["accounts", generateQuery(filter)], queryFn: async () => {
      const { data } = await axios.get('/api/payment/accounts' + generateQuery(filter))
      return data
    }
  })
  const { data: profitsData, isLoading: profitsLoading } = useQuery<TProfitsData>({
    queryKey: ["profits", generateQuery(filter)], queryFn: async () => {
      const { data } = await axios.get('/api/payment/profits' + generateQuery(filter))
      return data
    }
  })


  const handleFilter = () => {
    setFilter(filterDummy)
    setFilterOpen(false)
  }
  const handleCancelFilter = () => {
    setFilterDummy({ ...filter })
    setFilterOpen(false)
  }
  const handleCurrentFilter = () => {
    setFilter({ m: "current", y: "" })
    setFilterDummy({ m: "current", y: "" })
    setFilterOpen(false)
  }
  const handleAllFilter = () => {
    setFilter({ m: "", y: "" })
    setFilterDummy({ m: "", y: "" })
    setFilterOpen(false)
  }

  return (
    <DefaultLayout>
      {accountsLoading && profitsLoading ? (
        <div className="flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : isPrint ?
        <>
          <button onClick={() => setIsPrint(false)} className="items-center justify-center rounded-md border-red px-4 py-3 mb-3 hover:bg-red hover:bg-opacity-10 text-center font-medium text-red w-full transition-colors duration-300 cursor-pointer border">
            Cancel
          </button>
          <ReactToPrint trigger={() =>
            <p className="items-center justify-center rounded-t-md bg-primary px-4 py-3 text-center font-medium border-primary  text-white transition-colors duration-300 cursor-pointer border hover:bg-opacity-90">
              Download / Print
            </p>
          } content={() => componentRef.current} />
          <div className="relative" ref={componentRef}>
            <img src="/images/invoice.jpg" alt="Invoice Bg" />
            <div className="absolute top-0 text-[#000000] mt-[35%] uppercase px-20">
              <h1 className="text-center text-2xl font-bold">{filter.m && filter.y ? filter.m + " / " + filter.y : filter.m || filter.y ? filter.m + filter.y : "All Time"} Report</h1>
              <ReportPage accountsData={accountsData} profitsData={profitsData} />
            </div>
          </div>
        </>
        :
        <>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-title-md2 capitalize font-semibold text-black dark:text-white">
              Accounts Report</h2>
            <div>
              <button type="button" onClick={() => setIsPrint(true)} className=" text-primary mr-5 hover:text-meta-10">
                Export Report
              </button>
              <button onClick={() => setFilterOpen(true)} className=" inline-flex gap-3 border-primary border font-semibold text-white bg-primary transition-colors duration-300 rounded hover:bg-opacity-90 p-3 capitalize">

                {filter.m && filter.y ? filter.m + " / " + filter.y : filter.m || filter.y ? filter.m + filter.y : "All Time"}

                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12L5 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M19 20L19 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M5 20L5 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M19 12L19 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 7L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 20L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="5" cy="14" r="2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="9" r="2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="19" cy="15" r="2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {isFilterOpen && <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-999">
            <div className="bg-white dark:bg-black p-5 rounded-lg shadow-lg">
              <p className='text-center font-bold text-xl my-2 text-primary'>Filter Accounts Data</p>
              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">Month</label>
                  <div className="relative z-20 bg-transparent dark:bg-form-input">

                    <select
                      title="Select Month"
                      value={filterDummy.m}
                      name="from"
                      onChange={(e) => {
                        setFilterDummy({ ...filterDummy, m: e.target.value })
                      }}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"

                    >
                      <option value="" className="text-body dark:text-bodydark">
                        None
                      </option>
                      <option value="current" className="text-body dark:text-bodydark">
                        This Month
                      </option>
                      <option value="1" className="text-body dark:text-bodydark">
                        Jan
                      </option>
                      <option value="2" className="text-body dark:text-bodydark">
                        Feb                      </option>
                      <option value="3" className="text-body dark:text-bodydark">
                        Mar                      </option>
                      <option value="4" className="text-body dark:text-bodydark">
                        Apr                      </option>
                      <option value="5" className="text-body dark:text-bodydark">
                        May                      </option>
                      <option value="6" className="text-body dark:text-bodydark">
                        Jun                      </option>
                      <option value="7" className="text-body dark:text-bodydark">
                        Jul                      </option>
                      <option value="8" className="text-body dark:text-bodydark">
                        Aug                      </option>
                      <option value="9" className="text-body dark:text-bodydark">
                        Sep                      </option>
                      <option value="10" className="text-body dark:text-bodydark">
                        Oct                      </option>
                      <option value="11" className="text-body dark:text-bodydark">
                        Nov                      </option>
                      <option value="12" className="text-body dark:text-bodydark">
                        Dec                      </option>
                    </select>

                    <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
                      <svg className="fill-current"
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
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">Year</label>

                  <div className="relative z-20 bg-transparent dark:bg-form-input">
                    <input type="text"
                      placeholder="Enter Year"
                      value={filterDummy.y}
                      name="y"
                      onChange={(e) => {
                        setFilterDummy({ ...filterDummy, y: e.target.value })
                      }}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />

                  </div>
                </div>

              </div>

              <div className="flex justify-between">
                <div className="inline-flex items-center gap-2">
                  <button type="button" onClick={handleCurrentFilter} className="text-primary hover:text-meta-10">
                    This Month
                  </button>  | <button type="button" onClick={handleAllFilter} className=" text-primary hover:text-meta-10">
                    All Time
                  </button>
                </div>
                <div>
                  <button type="button" onClick={handleCancelFilter} className="mr-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg">
                    Cancel
                  </button>
                  <button type="button" onClick={handleFilter} className="px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-lg">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">

            <CardDataStats
              title="Total Transactions"
              total={`${(accountsData?.expenseCount ?? 0) + (accountsData?.incomeCount ?? 0)}`}
            />
            <CardDataStats
              title="Net Profit"
              total={`${(accountsData?.netProfit ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Total Credit"
              total={`${((profitsData?.totalToGet ?? 0) * -1).toFixed(2)} AED`}
              color="meta-3"
            />
            <CardDataStats
              title="Total Debit"
              total={`${(profitsData?.totalToGive ?? 0).toFixed(2)} AED`}
              color="red"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            <CardDataStats
              title="Total Balance"
              total={`${(accountsData?.totalBalance ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Cash Balance"
              total={`${(accountsData?.cashBalance ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Bank Balance"
              total={`${(accountsData?.bankBalance ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Tasdeed Balance"
              total={`${(accountsData?.tasdeedBalance ?? 0).toFixed(2)} AED`}
            />
          </div>

          <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
            <ChartOne
              months={accountsData?.monthNames ?? []}
              profit={accountsData?.last12MonthsProfit ?? []}
              expense={accountsData?.last12MonthsExpenses ?? []}
            />
            <ChartTwo
              dates={accountsData?.daysOfWeekInitials ?? []}
              profit={accountsData?.profitLast7DaysTotal ?? []}
              expense={accountsData?.expensesLast7DaysTotal ?? []}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            <CardDataStats
              title="Office Expense"
              total={`${accountsData?.zaadExpenseTotal.toFixed(2)} AED`}
            />
            <CardDataStats
              title="Total Profit"
              total={`${(accountsData?.profit ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Profit This Month"
              total={`${accountsData?.last12MonthsProfit[11].toFixed(2)
                } AED`}
            />
            <CardDataStats
              title="Today Profit"
              total={`${accountsData?.profitLast7DaysTotal[6].toFixed(2)
                } AED`}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            <CardDataStats
              title="Cash Income"
              total={`${(accountsData?.CashIncome ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Bank Income"
              total={`${(accountsData?.BankIncome ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Tasdeed Income"
              total={`${(accountsData?.TasdeedIncome ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Swiper Income"
              total={`${(accountsData?.SwiperIncome ?? 0).toFixed(2)} AED`}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            <CardDataStats
              title="Cash Expense"
              total={`${(accountsData?.CashExpense ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Bank Expense"
              total={`${(accountsData?.BankExpense ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Tasdeed Expense"
              total={`${(accountsData?.TasdeedExpense ?? 0).toFixed(2)} AED`}
            />
            <CardDataStats
              title="Swiper Expense"
              total={`${(accountsData?.SwiperExpense ?? 0).toFixed(2)} AED`}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            <CardDataStats
              title="Companies Credit"
              total={`${((profitsData?.totalToGetCompanies ?? 0) * -1).toFixed(2)}
                AED`}
              color="meta-3"
            />
            <CardDataStats
              title="Companies Debit"
              total={`${(profitsData?.totalToGiveCompanies ?? 0).toFixed(2)} AED`}
              color="red"
            />
            <CardDataStats
              title="Individual Credit"
              total={`${((profitsData?.totalToGetEmployees ?? 0) * -1).toFixed(2)}
                AED`}
              color="meta-3"
            />
            <CardDataStats
              title="Individual Debit"
              total={`${(profitsData?.totalToGiveEmployees ?? 0).toFixed(2)} AED`}
              color="red"
            />
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {(profitsData?.over0balanceCompanies ?? []).length !== 0 && (
              <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
                <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
                  Company Debit List
                </h4>

                <div>
                  {profitsData?.over0balanceCompanies.map((data, key) => (
                    <Link
                      href={`/company/${data.id}`}
                      className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
                      key={key}
                    >
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-red"></div>

                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <h5 className="font-medium text-black dark:text-white">
                            {data.name}
                          </h5>
                        </div>
                        <div>
                          <h5 className="font-medium text-red">
                            {data.balance.toFixed(2)} AED
                          </h5>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {profitsData?.under0balanceCompanies?.length !== 0 && (
              <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
                <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
                  Company Credit List
                </h4>

                <div>
                  {profitsData?.under0balanceCompanies?.map((data, key) => (
                    <Link
                      href={`/company/${data.id}`}
                      className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
                      key={key}
                    >
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-meta-3"></div>

                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <h5 className="font-medium text-black dark:text-white">
                            {data.name}
                          </h5>
                        </div>
                        <div>
                          <h5 className="font-medium text-meta-3">
                            {(data.balance * -1).toFixed(2)} AED
                          </h5>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {profitsData?.over0balanceEmployees?.length !== 0 && (
              <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
                <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
                  Individual Debit List
                </h4>

                <div>
                  {(profitsData?.over0balanceEmployees ?? []).map((data, key) => (
                    <Link
                      href={`/employee/${data.id}`}
                      className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
                      key={key}
                    >
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-red"></div>

                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <h5 className="font-medium text-black dark:text-white">
                            {data.name}
                          </h5>
                        </div>
                        <div>
                          <h5 className="font-medium text-red">
                            {data.balance.toFixed(2)} AED
                          </h5>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {profitsData?.under0balanceEmployees?.length !== 0 && (
              <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
                <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
                  Individual Credit List
                </h4>

                <div>
                  {(profitsData?.under0balanceEmployees ?? []).map((data, key) => (
                    <Link
                      href={`/employee/${data.id}`}
                      className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
                      key={key}
                    >
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-meta-3"></div>

                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <h5 className="font-medium text-black dark:text-white">
                            {data.name}
                          </h5>
                        </div>
                        <div>
                          <h5 className="font-medium text-meta-3">
                            {(data.balance * -1).toFixed(2)} AED
                          </h5>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      }
    </DefaultLayout>
  )
}
