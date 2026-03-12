import { ApexOptions } from "apexcharts";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic'
const ReactApexChart = dynamic(() => import("react-apexcharts"));


interface ChartOneState {
  series: {
    name: string;
    data: number[];
  }[];
}

type ChartOneProps = {
  months: string[],
  profit: number[],
  expense: number[]
}

const ChartOne: React.FC<ChartOneProps> = ({ months, profit, expense }) => {
  const [year, prevYear] = [new Date().getFullYear(), new Date().getFullYear() - 1]
  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#f43f5e", "#10b981"],
    chart: {
      fontFamily: "Satoshi, sans-serif",
      height: 335,
      type: "area",
      dropShadow: {
        enabled: true,
        color: "#623CEA14",
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 350,
          },
        },
      },
    ],
    stroke: {
      width: [2, 2],
      curve: "straight",
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
      colors: "#fff",
      strokeColors: ["#80CAEE", "#3056D3"],
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: "category",
      categories: months,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        style: {
          fontSize: "0px",
        },
      },
      min: 0,
      max: Math.ceil(Math.max(...profit, ...expense) / 100) * 100,
    },
  };


  const [seriesData, setSeriesData] = useState<ChartOneState["series"]>([
    {
      name: "Expense",
      data: [],
    },
    {
      name: "Profit",
      data: [],
    },
  ]);

  useEffect(() => {
    setSeriesData([
      {
        name: "Expense",
        data: expense,
      },
      {
        name: "Profit",
        data: profit,
      },

    ]);
  }, [profit, expense]);

  const handleReset = () => {
    setSeriesData((prevState) => ({
      ...prevState,
    }));
  };

  handleReset


  return (
    <div className="col-span-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-8 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-47.5">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-emerald-500">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">Profit Amount</p>
              <p className="text-sm font-medium text-slate-500">{months[0]} {prevYear} - {months[11]} {year}</p>
            </div>
          </div>
          <div className="flex min-w-47.5">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-rose-500">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-rose-500"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-rose-600 dark:text-rose-400">Total Expense</p>
              <p className="text-sm font-medium text-slate-500">{months[0]} {prevYear} - {months[11]} {year}</p>            </div>
          </div>


        </div>
        <div className="flex w-full max-w-45 justify-end">
          <div className="inline-flex items-center rounded-xl bg-slate-50 p-1.5 dark:bg-slate-800">
            <button className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-800 shadow-sm hover:bg-white dark:bg-slate-900 dark:text-white dark:hover:bg-slate-900">
              Graph
            </button>
            <Link href={"/accounts/transactions"} className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white">
              List View
            </Link>
          </div>
        </div>
      </div>

      <div>
        <div id="chartOne" className="-ml-5">
          {(typeof window !== 'undefined') &&

            <ReactApexChart
              options={options}
              series={seriesData}
              type="area"
              height={350}
              width={"100%"}
            />}
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
