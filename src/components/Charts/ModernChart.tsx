import { ApexOptions } from "apexcharts";
import React from "react";
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ModernChartProps = {
  months: string[];
  profit: number[];
  expense: number[];
};

const ModernChart: React.FC<ModernChartProps> = ({ months, profit, expense }) => {
  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontSize: "14px",
      fontFamily: "Inter, sans-serif",
      labels: {
        colors: "#64748b",
      },
    },
    colors: ["#10b981", "#ef4444"],
    chart: {
      fontFamily: "Inter, sans-serif",
      height: 350,
      type: "area",
      dropShadow: {
        enabled: true,
        color: "#10b981",
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
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
    ],
    stroke: {
      width: [3, 3],
      curve: "smooth",
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
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
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 5,
      colors: "#fff",
      strokeColors: ["#10b981", "#ef4444"],
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      hover: {
        size: 7,
        sizeOffset: 3,
      },
    },
    xaxis: {
      categories: months,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
          fontFamily: "Inter, sans-serif",
        },
      },
    },
    yaxis: {
      title: {
        text: "Amount (AED)",
        style: {
          color: "#64748b",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
        },
      },
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
          fontFamily: "Inter, sans-serif",
        },
        formatter: (value) => `${value.toFixed(0)}`,
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.3,
        gradientToColors: ["#10b981", "#ef4444"],
        inverseColors: false,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      style: {
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
      },
      y: {
        formatter: (value) => `${value.toFixed(2)} AED`,
      },
    },
  };

  const series = [
    {
      name: "Income",
      data: profit,
    },
    {
      name: "Expense",
      data: expense,
    },
  ];

  return (
    <div className="col-span-12 rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark xl:col-span-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-black dark:text-white">
            Revenue Analytics
          </h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monthly income vs expense comparison
          </p>
        </div>
      </div>

      <div id="chartOne" className="-ml-5">
        <ReactApexChart options={options} series={series} type="area" height={350} />
      </div>
    </div>
  );
};

export default ModernChart;
