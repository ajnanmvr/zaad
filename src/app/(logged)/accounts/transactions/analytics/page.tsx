"use client";
import React, { useRef } from "react";
import ChartOne from "@/components/Charts/ChartOne";
import ChartTwo from "@/components/Charts/ChartTwo";
import CardDataStats from "@/components/CardDataStats";

import axios from "axios";
import { useState } from "react";
import Link from "next/link";
import ReactToPrint from "react-to-print";
import ReportPage from "@/components/ReportPage";
import { TAccountsData, TProfitsData } from "@/types/dashboard";
import { useQuery } from "@tanstack/react-query";
import { FiFilter, FiPrinter, FiX, FiChevronDown, FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, FiBriefcase, FiUsers } from "react-icons/fi";
import clsx from "clsx";

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

  const getFilterDisplay = () => {
    if (filter.m && filter.y) return `${filter.m} / ${filter.y}`;
    if (filter.m || filter.y) return filter.m + filter.y;
    return "All Time";
  }

  return (
    <>
      {accountsLoading && profitsLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent"></div>
        </div>
      ) : isPrint ? (
          <>
            <button onClick={() => setIsPrint(false)} className="items-center justify-center rounded-md border-red px-4 py-3 mb-3 hover:bg-red hover:bg-opacity-10 text-center font-medium text-red w-full transition-colors duration-300 cursor-pointer border">
              Cancel
            </button>
            <ReactToPrint trigger={() =>
              <p className="items-center justify-center rounded-t-md bg-emerald-600 px-4 py-3 text-center font-medium border-emerald-600 text-white transition-colors duration-300 cursor-pointer border hover:bg-opacity-90">
                Download / Print
              </p>
            } content={() => componentRef.current} />
            <div className="relative" ref={componentRef}>
              <img src="/images/invoice.jpg" alt="Invoice Bg" />
              <div className="absolute top-0 text-[#000000] mt-[35%] uppercase px-20">
                <h1 className="text-center text-2xl font-bold">{getFilterDisplay()} Report</h1>
                <ReportPage accountsData={accountsData} profitsData={profitsData} />
              </div>
            </div>
          </>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">
                Accounts Report
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Detailed financial overview and analytics</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => setIsPrint(true)} 
                className="group flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 font-medium text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <FiPrinter className="text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200" />
                <span>Export Report</span>
              </button>
              <button 
                onClick={() => setFilterOpen(true)} 
                className="flex items-center justify-between gap-3 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 capitalize min-w-[200px]"
              >
                <span className="flex items-center gap-2"><FiFilter /> {getFilterDisplay()}</span>
                <FiChevronDown />
              </button>
            </div>
          </div>

          {/* Filter Modal Overlay */}
          {isFilterOpen && (
            <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 relative">
                <button onClick={handleCancelFilter} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <FiX className="text-xl" />
                </button>
                
                <h3 className="mb-6 text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FiFilter className="text-emerald-500" />
                  Filter Accounts Data
                </h3>

                <div className="mb-6 flex flex-col gap-6 sm:flex-row">
                  <div className="w-full sm:w-1/2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Month</label>
                    <select
                      value={filterDummy.m}
                      name="from"
                      onChange={(e) => setFilterDummy({ ...filterDummy, m: e.target.value })}
                      className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">None</option>
                      <option value="current">This Month</option>
                      <option value="1">Jan</option>
                      <option value="2">Feb</option>
                      <option value="3">Mar</option>
                      <option value="4">Apr</option>
                      <option value="5">May</option>
                      <option value="6">Jun</option>
                      <option value="7">Jul</option>
                      <option value="8">Aug</option>
                      <option value="9">Sep</option>
                      <option value="10">Oct</option>
                      <option value="11">Nov</option>
                      <option value="12">Dec</option>
                    </select>
                  </div>

                  <div className="w-full sm:w-1/2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Year</label>
                    <input 
                      type="text"
                      placeholder="e.g. 2024"
                      value={filterDummy.y}
                      name="y"
                      onChange={(e) => setFilterDummy({ ...filterDummy, y: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8">
                  <div className="flex gap-4 text-sm font-medium">
                    <button type="button" onClick={handleCurrentFilter} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                      This Month
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button type="button" onClick={handleAllFilter} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                      All Time
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleCancelFilter} className="rounded-xl bg-slate-100 px-6 py-2.5 font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                      Cancel
                    </button>
                    <button onClick={handleFilter} className="rounded-xl bg-emerald-600 px-6 py-2.5 font-medium text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/30">
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics Row 1 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <CardDataStats title="Total Transactions" total={`${(accountsData?.expenseCount ?? 0) + (accountsData?.incomeCount ?? 0)}`}>
              <FiBriefcase className="text-xl" />
            </CardDataStats>
            <CardDataStats title="Net Profit" total={`${(accountsData?.netProfit ?? 0).toFixed(2)} AED`}>
              <FiDollarSign className="text-xl" />
            </CardDataStats>
            <CardDataStats title="Total Credit" total={`${((profitsData?.totalToGet ?? 0) * -1).toFixed(2)} AED`} color="emerald-500">
              <FiTrendingUp className="text-xl text-emerald-500" />
            </CardDataStats>
            <CardDataStats title="Total Debit" total={`${(profitsData?.totalToGive ?? 0).toFixed(2)} AED`} color="rose-500">
              <FiTrendingDown className="text-xl text-rose-500" />
            </CardDataStats>
          </div>

          {/* Balance Metrics Row 2 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <CardDataStats title="Total Balance" total={`${(accountsData?.totalBalance ?? 0).toFixed(2)} AED`}>
              <FiDollarSign className="text-xl" />
            </CardDataStats>
            <CardDataStats title="Cash Balance" total={`${(accountsData?.cashBalance ?? 0).toFixed(2)} AED`}>
              <FiDollarSign className="text-xl" />
            </CardDataStats>
            <CardDataStats title="Bank Balance" total={`${(accountsData?.bankBalance ?? 0).toFixed(2)} AED`}>
              <FiCreditCard className="text-xl" />
            </CardDataStats>
            <CardDataStats title="Tasdeed Balance" total={`${(accountsData?.tasdeedBalance ?? 0).toFixed(2)} AED`}>
              <FiDollarSign className="text-xl" />
            </CardDataStats>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <ChartOne months={accountsData?.monthNames ?? []} profit={accountsData?.last12MonthsProfit ?? []} expense={accountsData?.last12MonthsExpenses ?? []} />
            <ChartTwo dates={accountsData?.daysOfWeekInitials ?? []} profit={accountsData?.profitLast7DaysTotal ?? []} expense={accountsData?.expensesLast7DaysTotal ?? []} />
          </div>

          {/* Additional Metrics Row 3 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <CardDataStats title="Office Expense" total={`${accountsData?.zaadExpenseTotal.toFixed(2)} AED`}>
              <FiBriefcase className="text-xl" />
            </CardDataStats>
            <CardDataStats title="Total Profit" total={`${(accountsData?.profit ?? 0).toFixed(2)} AED`}>
              <FiTrendingUp className="text-xl text-emerald-500" />
            </CardDataStats>
            <CardDataStats title="Profit This Month" total={`${accountsData?.last12MonthsProfit[11].toFixed(2)} AED`}>
              <FiTrendingUp className="text-xl text-emerald-500" />
            </CardDataStats>
            <CardDataStats title="Today Profit" total={`${accountsData?.profitLast7DaysTotal[6].toFixed(2)} AED`}>
              <FiTrendingUp className="text-xl text-emerald-500" />
            </CardDataStats>
          </div>

          {/* Income By Method Row 4 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <CardDataStats title="Cash Income" total={`${(accountsData?.CashIncome ?? 0).toFixed(2)} AED`}>
              <FiDollarSign className="text-xl text-emerald-500" />
            </CardDataStats>
            <CardDataStats title="Bank Income" total={`${(accountsData?.BankIncome ?? 0).toFixed(2)} AED`}>
              <FiCreditCard className="text-xl text-emerald-500" />
            </CardDataStats>
            <CardDataStats title="Tasdeed Income" total={`${(accountsData?.TasdeedIncome ?? 0).toFixed(2)} AED`}>
              <FiTrendingUp className="text-xl text-emerald-500" />
            </CardDataStats>
            <CardDataStats title="Swiper Income" total={`${(accountsData?.SwiperIncome ?? 0).toFixed(2)} AED`}>
              <FiCreditCard className="text-xl text-emerald-500" />
            </CardDataStats>
          </div>

          {/* Expense By Method Row 5 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <CardDataStats title="Cash Expense" total={`${(accountsData?.CashExpense ?? 0).toFixed(2)} AED`}>
              <FiDollarSign className="text-xl text-rose-500" />
            </CardDataStats>
            <CardDataStats title="Bank Expense" total={`${(accountsData?.BankExpense ?? 0).toFixed(2)} AED`}>
              <FiCreditCard className="text-xl text-rose-500" />
            </CardDataStats>
            <CardDataStats title="Tasdeed Expense" total={`${(accountsData?.TasdeedExpense ?? 0).toFixed(2)} AED`}>
              <FiTrendingDown className="text-xl text-rose-500" />
            </CardDataStats>
            <CardDataStats title="Swiper Expense" total={`${(accountsData?.SwiperExpense ?? 0).toFixed(2)} AED`}>
              <FiCreditCard className="text-xl text-rose-500" />
            </CardDataStats>
          </div>

          {/* Entity Credit/Debit Row 6 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <CardDataStats title="Companies Credit" total={`${((profitsData?.totalToGetCompanies ?? 0) * -1).toFixed(2)} AED`} color="emerald-500" />
            <CardDataStats title="Companies Debit" total={`${(profitsData?.totalToGiveCompanies ?? 0).toFixed(2)} AED`} color="rose-500" />
            <CardDataStats title="Individual Credit" total={`${((profitsData?.totalToGetEmployees ?? 0) * -1).toFixed(2)} AED`} color="emerald-500" />
            <CardDataStats title="Individual Debit" total={`${(profitsData?.totalToGiveEmployees ?? 0).toFixed(2)} AED`} color="rose-500" />
          </div>

          {/* Debt Lists Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            
            {/* Company Debit List */}
            {(profitsData?.over0balanceCompanies ?? []).length > 0 && (
              <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 dark:border-rose-900/30 dark:bg-slate-900/50 dark:ring-slate-800/50">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"><FiBriefcase className="text-xl" /></div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white">Company Debit List</h4>
                </div>
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {profitsData?.over0balanceCompanies.map((data, key) => (
                    <Link
                      href={`/company/${data.id}`}
                      key={key}
                      className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-rose-200 hover:bg-rose-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-rose-900/50 dark:hover:bg-rose-900/20"
                    >
                      <h5 className="font-semibold capitalize text-slate-700 group-hover:text-rose-700 dark:text-slate-300 dark:group-hover:text-rose-400">
                        {data.name}
                      </h5>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {data.balance.toFixed(2)} <span className="text-xs font-medium">AED</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Company Credit List */}
            {profitsData?.under0balanceCompanies?.length !== 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 dark:border-emerald-900/30 dark:bg-slate-900/50 dark:ring-slate-800/50">
                 <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><FiBriefcase className="text-xl" /></div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white">Company Credit List</h4>
                </div>
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {profitsData?.under0balanceCompanies?.map((data, key) => (
                    <Link
                      href={`/company/${data.id}`}
                      key={key}
                      className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-900/20"
                    >
                      <h5 className="font-semibold capitalize text-slate-700 group-hover:text-emerald-700 dark:text-slate-300 dark:group-hover:text-emerald-400">
                        {data.name}
                      </h5>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {(data.balance * -1).toFixed(2)} <span className="text-xs font-medium">AED</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Debit List */}
            {profitsData?.over0balanceEmployees?.length !== 0 && (
              <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 dark:border-rose-900/30 dark:bg-slate-900/50 dark:ring-slate-800/50">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"><FiUsers className="text-xl" /></div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white">Individual Debit List</h4>
                </div>
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(profitsData?.over0balanceEmployees ?? []).map((data, key) => (
                    <Link
                      href={`/employee/${data.id}`}
                      key={key}
                      className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-rose-200 hover:bg-rose-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-rose-900/50 dark:hover:bg-rose-900/20"
                    >
                      <h5 className="font-semibold capitalize text-slate-700 group-hover:text-rose-700 dark:text-slate-300 dark:group-hover:text-rose-400">
                        {data.name}
                      </h5>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {data.balance.toFixed(2)} <span className="text-xs font-medium">AED</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Credit List */}
            {profitsData?.under0balanceEmployees?.length !== 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 dark:border-emerald-900/30 dark:bg-slate-900/50 dark:ring-slate-800/50">
                 <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><FiUsers className="text-xl" /></div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white">Individual Credit List</h4>
                </div>
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(profitsData?.under0balanceEmployees ?? []).map((data, key) => (
                    <Link
                      href={`/employee/${data.id}`}
                      key={key}
                      className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-900/20"
                    >
                      <h5 className="font-semibold capitalize text-slate-700 group-hover:text-emerald-700 dark:text-slate-300 dark:group-hover:text-emerald-400">
                        {data.name}
                      </h5>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {(data.balance * -1).toFixed(2)} <span className="text-xs font-medium">AED</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </>
  )
}
