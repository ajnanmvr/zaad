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
    colors: ["#80CAEE", "#3C50E0",],
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
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-47.5">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-[#3c50e0]">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-[#3c50e0]"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-[#3c50e0]">Profit Amount</p>
              <p className="text-sm font-medium">{months[0]} {prevYear} - {months[11]} {year}</p>
            </div>
          </div>
          <div className="flex min-w-47.5">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-secondary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-secondary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-secondary">Total Expense</p>
              <p className="text-sm font-medium">{months[0]} {prevYear} - {months[11]} {year}</p>            </div>
          </div>


        </div>
        <div className="flex w-full max-w-45 justify-end">
          <div className="inline-flex items-center rounded-md bg-whiter p-1.5 dark:bg-meta-4">
            <button className="rounded bg-white px-3 py-1 text-xs font-medium text-black shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:text-white dark:hover:bg-boxdark">
              Graph
            </button>
            {/* <button className="rounded px-3 py-1 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark">
              Week
            </button> */}
            <Link href={"/accounts/transactions"} className="rounded px-3 py-1 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark">
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
