"use client";

import React, { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import axios from "axios";
import ReactToPrint from "react-to-print";
import { ApexOptions } from "apexcharts";
import { useQuery } from "@tanstack/react-query";
import ReportPage from "@/components/ReportPage";
import { TAccountsData, TProfitsData } from "@/types/dashboard";
import {
  FiBarChart2,
  FiBriefcase,
  FiChevronDown,
  FiFilter,
  FiPrinter,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const baseFilter = { y: "", m: "" };
const monthFallback = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekFallback = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatCurrency = (value: number) => `${value.toFixed(2)} AED`;

const normalize = (items: number[] | undefined, size: number) => {
  const values = Array.isArray(items) ? items.slice(0, size) : [];
  while (values.length < size) values.push(0);
  return values;
};

type ExposureItem = { name: string; balance: number; id: string };

function ExposureColumn({
  title,
  icon,
  tone,
  items,
  hrefBuilder,
  valueFormatter,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "emerald" | "rose";
  items: ExposureItem[];
  hrefBuilder: (id: string) => string;
  valueFormatter: (value: number) => string;
}) {
  const toneStyle =
    tone === "emerald"
      ? "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
      : "border-rose-200/70 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20";

  const itemStyle =
    tone === "emerald"
      ? "border-emerald-100/90 hover:border-emerald-200 dark:border-emerald-900/40"
      : "border-rose-100/90 hover:border-rose-200 dark:border-rose-900/40";

  return (
    <section className={`rounded-3xl border p-5 ${toneStyle}`}>
      <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
        {icon}
        {title}
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-400">
            No records for current filter.
          </p>
        ) : (
          items.slice(0, 8).map((item) => (
            <Link
              key={`${title}-${item.id}`}
              href={hrefBuilder(item.id)}
              className={`flex items-center justify-between rounded-2xl border bg-white/80 px-4 py-3 transition dark:bg-slate-900/50 ${itemStyle}`}
            >
              <span className="truncate pr-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{item.name}</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{valueFormatter(item.balance)}</span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

export default function AccountsDashboard() {
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isPrint, setIsPrint] = useState(false);
  const [filterDraft, setFilterDraft] = useState({ ...baseFilter });
  const [filter, setFilter] = useState({ ...baseFilter });
  const componentRef = useRef<HTMLDivElement | null>(null);

  const generateQuery = (current: { m: string; y: string }) => {
    if (current.m !== "current" && current.m && current.y) return `?m=${current.m}&y=${current.y}`;
    if (!current.m && current.y) return `?y=${current.y}`;
    if (current.m && current.m !== "current") return `?m=${current.m}`;
    if (current.m === "current") return "?m=current";
    return "";
  };

  const query = generateQuery(filter);

  const { data: accountsData, isLoading: accountsLoading } = useQuery<TAccountsData>({
    queryKey: ["accounts", query],
    queryFn: async () => {
      const { data } = await axios.get(`/api/payment/accounts${query}`);
      return data;
    },
  });

  const { data: profitsData, isLoading: profitsLoading } = useQuery<TProfitsData>({
    queryKey: ["profits", query],
    queryFn: async () => {
      const { data } = await axios.get(`/api/payment/profits${query}`);
      return data;
    },
  });

  const filterDisplay = useMemo(() => {
    if (filter.m && filter.y) return `${filter.m} / ${filter.y}`;
    if (filter.m || filter.y) return `${filter.m}${filter.y}`;
    return "All Time";
  }, [filter]);

  const monthLabels = useMemo(() => {
    const labels = accountsData?.monthNames ?? [];
    return labels.length === 12 ? labels : monthFallback;
  }, [accountsData]);

  const weekLabels = useMemo(() => {
    const labels = accountsData?.daysOfWeekInitials ?? [];
    return labels.length === 7 ? labels : weekFallback;
  }, [accountsData]);

  const monthlyProfit = normalize(accountsData?.last12MonthsProfit, 12);
  const monthlyExpense = normalize(accountsData?.last12MonthsExpenses, 12);
  const weeklyProfit = normalize(accountsData?.profitLast7DaysTotal, 7);
  const weeklyExpense = normalize(accountsData?.expensesLast7DaysTotal, 7);

  const incomeMethodData = [
    accountsData?.CashIncome ?? 0,
    accountsData?.BankIncome ?? 0,
    accountsData?.TasdeedIncome ?? 0,
    accountsData?.SwiperIncome ?? 0,
  ];
  const expenseMethodData = [
    accountsData?.CashExpense ?? 0,
    accountsData?.BankExpense ?? 0,
    accountsData?.TasdeedExpense ?? 0,
    accountsData?.SwiperExpense ?? 0,
  ];

  const balanceSeries = [
    accountsData?.cashBalance ?? 0,
    accountsData?.bankBalance ?? 0,
    accountsData?.tasdeedBalance ?? 0,
  ];

  const monthlyChartOptions: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    colors: ["#10b981", "#f43f5e"],
    stroke: { width: [3, 3], curve: "smooth" },
    dataLabels: { enabled: false },
    grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] },
    },
    legend: { position: "top", horizontalAlign: "left" },
    xaxis: { categories: monthLabels, axisTicks: { show: false } },
  };

  const weeklyChartOptions: ApexOptions = {
    chart: { type: "bar", stacked: true, toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    colors: ["#0ea5e9", "#fb7185"],
    dataLabels: { enabled: false },
    plotOptions: {
      bar: { horizontal: false, borderRadius: 8, borderRadiusApplication: "end", columnWidth: "42%" },
    },
    legend: { position: "top", horizontalAlign: "left" },
    grid: { borderColor: "#e2e8f0", strokeDashArray: 3 },
    xaxis: { categories: weekLabels },
  };

  const methodChartOptions: ApexOptions = {
    chart: { type: "radar", toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    xaxis: { categories: ["Cash", "Bank", "Tasdeed", "Swiper"] },
    stroke: { width: 2 },
    fill: { opacity: 0.2 },
    colors: ["#22c55e", "#ef4444"],
    markers: { size: 4 },
  };

  const balanceChartOptions: ApexOptions = {
    chart: { type: "donut", toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    labels: ["Cash", "Bank", "Tasdeed"],
    colors: ["#0ea5e9", "#6366f1", "#14b8a6"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            value: { formatter: (value) => `${Number(value).toFixed(0)}` },
          },
        },
      },
    },
  };

  const handleApplyFilter = () => {
    setFilter(filterDraft);
    setFilterOpen(false);
  };

  const handleCancelFilter = () => {
    setFilterDraft({ ...filter });
    setFilterOpen(false);
  };

  const handleCurrentFilter = () => {
    setFilter({ m: "current", y: "" });
    setFilterDraft({ m: "current", y: "" });
    setFilterOpen(false);
  };

  const handleAllFilter = () => {
    setFilter({ m: "", y: "" });
    setFilterDraft({ m: "", y: "" });
    setFilterOpen(false);
  };

  if (accountsLoading || profitsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (isPrint) {
    return (
      <>
        <button
          onClick={() => setIsPrint(false)}
          className="mb-3 w-full rounded-md border border-red px-4 py-3 text-center font-medium text-red transition hover:bg-red/10"
        >
          Cancel
        </button>
        <ReactToPrint
          trigger={() => (
            <p className="cursor-pointer rounded-t-md border border-emerald-600 bg-emerald-600 px-4 py-3 text-center font-medium text-white transition hover:bg-emerald-700">
              Download / Print
            </p>
          )}
          content={() => componentRef.current}
        />
        <div ref={componentRef} className="relative">
          <img src="/images/invoice.jpg" alt="Invoice Bg" />
          <div className="absolute top-0 mt-[35%] px-20 uppercase text-black">
            <h1 className="text-center text-2xl font-bold">{filterDisplay} Report</h1>
            <ReportPage accountsData={accountsData} profitsData={profitsData} />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 shadow-sm dark:border-cyan-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
              <FiBarChart2 />
              Finance Intelligence
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Analytics Command View</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600 dark:text-slate-400">
              Live graph-first breakdown of profitability, exposure, and payment behavior for {filterDisplay}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPrint(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
            >
              <FiPrinter />
              Export Report
            </button>
            <button
              onClick={() => setFilterOpen(true)}
              className="inline-flex min-w-[200px] items-center justify-between gap-3 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <span className="inline-flex items-center gap-2">
                <FiFilter />
                {filterDisplay}
              </span>
              <FiChevronDown />
            </button>
          </div>
        </div>
      </section>

      {isFilterOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <button onClick={handleCancelFilter} className="absolute right-6 top-6 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200">
              <FiX className="text-xl" />
            </button>

            <h3 className="mb-6 text-xl font-black text-slate-900 dark:text-white">Filter Analytics Window</h3>

            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Month</label>
                <select
                  value={filterDraft.m}
                  onChange={(e) => setFilterDraft({ ...filterDraft, m: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2026"
                  value={filterDraft.y}
                  onChange={(e) => setFilterDraft({ ...filterDraft, y: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm font-bold">
                <button type="button" onClick={handleCurrentFilter} className="text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400">
                  This Month
                </button>
                <button type="button" onClick={handleAllFilter} className="text-cyan-600 transition hover:text-cyan-700 dark:text-cyan-400">
                  All Time
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleCancelFilter} className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Cancel
                </button>
                <button onClick={handleApplyFilter} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">12-Month Profit vs Expense</h2>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trendline</p>
            </div>
            <ReactApexChart
              type="area"
              height={340}
              options={monthlyChartOptions}
              series={[
                { name: "Profit", data: monthlyProfit },
                { name: "Expense", data: monthlyExpense },
              ]}
            />
          </div>

          <div className="xl:col-span-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Balance Composition</h2>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Donut</p>
            </div>
            <ReactApexChart type="donut" height={340} options={balanceChartOptions} series={balanceSeries} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 xl:col-span-7 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Current Week Pulse</h2>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Stacked bars</p>
          </div>
          <ReactApexChart
            type="bar"
            height={320}
            options={weeklyChartOptions}
            series={[
              { name: "Profit", data: weeklyProfit },
              { name: "Expense", data: weeklyExpense },
            ]}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 xl:col-span-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Payment Method Dynamics</h2>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Radar</p>
          </div>
          <ReactApexChart
            type="radar"
            height={320}
            options={methodChartOptions}
            series={[
              { name: "Income", data: incomeMethodData },
              { name: "Expense", data: expenseMethodData },
            ]}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Exposure Ledger</h2>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Credit vs debit clusters</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ExposureColumn
            title="Companies Debit"
            icon={<FiBriefcase />}
            tone="rose"
            items={profitsData?.over0balanceCompanies ?? []}
            hrefBuilder={(id) => `/company/${id}`}
            valueFormatter={(value) => formatCurrency(value)}
          />
          <ExposureColumn
            title="Companies Credit"
            icon={<FiBriefcase />}
            tone="emerald"
            items={profitsData?.under0balanceCompanies ?? []}
            hrefBuilder={(id) => `/company/${id}`}
            valueFormatter={(value) => formatCurrency(value * -1)}
          />
          <ExposureColumn
            title="Individual Debit"
            icon={<FiUsers />}
            tone="rose"
            items={profitsData?.over0balanceEmployees ?? []}
            hrefBuilder={(id) => `/employee/${id}`}
            valueFormatter={(value) => formatCurrency(value)}
          />
          <ExposureColumn
            title="Individual Credit"
            icon={<FiUsers />}
            tone="emerald"
            items={profitsData?.under0balanceEmployees ?? []}
            hrefBuilder={(id) => `/employee/${id}`}
            valueFormatter={(value) => formatCurrency(value * -1)}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Net Profit</p>
          <p className="mt-2 inline-flex items-center gap-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
            <FiTrendingUp />
            {formatCurrency(accountsData?.netProfit ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">Total Debit</p>
          <p className="mt-2 inline-flex items-center gap-2 text-2xl font-black text-rose-700 dark:text-rose-300">
            <FiTrendingDown />
            {formatCurrency(profitsData?.totalToGive ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50/70 p-4 dark:border-cyan-900/30 dark:bg-cyan-950/20">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Transactions</p>
          <p className="mt-2 text-2xl font-black text-cyan-700 dark:text-cyan-300">
            {(accountsData?.incomeCount ?? 0) + (accountsData?.expenseCount ?? 0)} entries
          </p>
        </div>
      </section>
    </div>
  );
}
