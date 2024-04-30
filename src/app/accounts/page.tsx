"use client";
import React from "react";
import ChartOne from "@/components/Charts/ChartOne";
import ChartTwo from "@/components/Charts/ChartTwo";
import CardDataStats from "@/components/CardDataStats";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AccountsDashboard() {
  const [accountsData, setAccountsData] = useState({
    expenseCount: 0,
    totalExpenseAmount: 0,
    incomeCount: 0,
    totalIncomeAmount: 0,
    totalBalance: 0,
    bankBalance: 0,
    cashBalance: 0,
    tasdeedBalance: 0,
    BankIncome: 0,
    CashIncome: 0,
    TasdeedIncome: 0,
    SwiperIncome: 0,
    BankExpense: 0,
    CashExpense: 0,
    TasdeedExpense: 0,
    SwiperExpense: 0,
    last12MonthsExpenses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    last12MonthsProfit: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    monthNames: [""],
    profitLast7DaysTotal: [0],
    expensesLast7DaysTotal: [0],
    daysOfWeekInitials: [""]
  })
  const [profitsData, setProfitsData] = useState({
    over0balanceCompanies: [{ name: "", balance: "", id: "" }],
    under0balanceCompanies: [{ name: "", balance: "", id: "" }],
    totalProfitAllCompanies: 0,
    totalToGiveCompanies: 0,
    totalToGetCompanies: 0,
    over0balanceEmployees: [{ name: "", balance: "", id: "" }],
    under0balanceEmployees: [{ name: "", balance: "", id: "" }],
    totalProfitAllEmployees: 0,
    totalToGiveEmployees: 0,
    totalToGetEmployees: 0,
    profit: 0,
    totalToGive: 0,
    totalToGet: 0
  })
  const fetchData = async () => {
    try {
      const { data } = await axios.get("/api/home/accounts")
      const profit = await axios.get("/api/home/profit")
      setAccountsData(data)
      setProfitsData(profit.data)
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    fetchData()
  }, [])
  console.log(profitsData);

  return (
    <>
      <DefaultLayout>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats title="Total Transactions" total={`${accountsData.expenseCount + accountsData.incomeCount}`} />
          <CardDataStats title="Total Credit" total={`${profitsData.totalToGet}AED`} />
          <CardDataStats title="Total Debit" total={`${profitsData.totalToGive}AED`} />
          <CardDataStats title="Total Profit" total={`${profitsData.profit}AED`} />
        </div>

        <div className=" mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats title="Total Balance" total={`${accountsData.totalBalance}AED`} />
          <CardDataStats title="Cash Balance" total={`${accountsData.cashBalance}AED`} />
          <CardDataStats title="Bank Balance" total={`${accountsData.bankBalance}AED`} />
          <CardDataStats title="Tasdeed Balance" total={`${accountsData.tasdeedBalance}AED`} />
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          <ChartOne months={accountsData.monthNames} profit={accountsData.last12MonthsProfit} expense={accountsData.last12MonthsExpenses} />
          <ChartTwo dates={accountsData.daysOfWeekInitials} profit={accountsData.profitLast7DaysTotal} expense={accountsData.expensesLast7DaysTotal} />
        </div>
        <div className=" mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats title="Cash Income" total={`${accountsData.CashIncome}AED`} />
          <CardDataStats title="Bank Income" total={`${accountsData.BankIncome}AED`} />
          <CardDataStats title="Tasdeed Income" total={`${accountsData.TasdeedIncome}AED`} />
          <CardDataStats title="Swiper Income" total={`${accountsData.SwiperIncome}AED`} />
        </div>
        <div className=" mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats title="Cash Expense" total={`${accountsData.CashExpense}AED`} />
          <CardDataStats title="Bank Expense" total={`${accountsData.BankExpense}AED`} />
          <CardDataStats title="Tasdeed Expense" total={`${accountsData.TasdeedExpense}AED`} />
          <CardDataStats title="Swiper Expense" total={`${accountsData.SwiperExpense}AED`} />
        </div>
        <div className=" mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats title="Companies Credit" total={`${profitsData.totalToGetCompanies}AED`} />
          <CardDataStats title="Companies Debit" total={`${profitsData.totalToGiveCompanies}AED`} />
          <CardDataStats title="Individual Credit" total={`${profitsData.totalToGetEmployees}AED`} />
          <CardDataStats title="Individual Debit" total={`${profitsData.totalToGiveEmployees}AED`} />
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {profitsData.over0balanceCompanies.length !== 0 && (<div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
            <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
              Company Debit List
            </h4>

            <div>
              {profitsData.over0balanceCompanies.map((data, key) => (
                <Link
                  href={`/company/${data.id}`}
                  className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
                  key={key}
                >
                  <div
                    className="h-3.5 w-3.5 rounded-full border-2 border-white bg-meta-3"
                  ></div>

                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <h5 className="font-medium text-black dark:text-white">
                        {data.name}
                      </h5>
                    </div>
                    <div>
                      <h5 className="font-medium text-meta-3">
                        {data.balance}AED
                      </h5>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>)}
          {profitsData.under0balanceCompanies.length !== 0 && (
            <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
              <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
                Company Credit List
              </h4>

              <div>
                {profitsData.under0balanceCompanies.map((data, key) => (
                  <Link
                    href={`/company/${data.id}`}
                    className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
                    key={key}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full border-2 border-white bg-red"
                    ></div>

                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <h5 className="font-medium text-black dark:text-white">
                          {data.name}
                        </h5>
                      </div>
                      <div>
                        <h5 className="font-medium text-red">
                          {data.balance}AED
                        </h5>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>)}
          {profitsData.over0balanceEmployees.length !== 0 && (

            <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
              <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
                Individual Debit List
              </h4>

              <div>
                {profitsData.over0balanceEmployees.map((data, key) => (
                  <Link
                    href={`/employee/${data.id}`}
                    className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
                    key={key}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full border-2 border-white bg-meta-3"
                    ></div>

                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <h5 className="font-medium text-black dark:text-white">
                          {data.name}
                        </h5>
                      </div>
                      <div>
                        <h5 className="font-medium text-meta-3">
                          {data.balance}AED
                        </h5>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>)}
          {profitsData.under0balanceEmployees.length !== 0 && (

            <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
              <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
                Individual Credit List
              </h4>

              <div>
                {profitsData.under0balanceEmployees.map((data, key) => (
                  <Link
                    href={`/employee/${data.id}`}
                    className="flex capitalize items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
                    key={key}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full border-2 border-white bg-red"
                    ></div>

                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <h5 className="font-medium text-black dark:text-white">
                          {data.name}
                        </h5>
                      </div>
                      <div>
                        <h5 className="font-medium text-red">
                          {data.balance}AED
                        </h5>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>)}
        </div>
      </DefaultLayout>
    </>
  );
}
