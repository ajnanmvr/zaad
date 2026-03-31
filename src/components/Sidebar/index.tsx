"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SidebarLinkGroup from "./SidebarLinkGroup";
import { useUserContext } from "@/contexts/UserContext";
import { 
  FiHome, 
  FiBriefcase, 
  FiUsers, 
  FiUserPlus, 
  FiFileText, 
  FiClock,
  FiPieChart, 
  FiTrendingUp, 
  FiTrendingDown,
  FiBookOpen,
  FiFolderPlus
} from "react-icons/fi";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  let storedSidebarExpanded = "true";
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true"
  );

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!sidebarOpen || key !== "Escape") return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector("body")?.classList.add("sidebar-expanded");
    } else {
      document.querySelector("body")?.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-white border-r border-slate-200/50 duration-300 ease-linear dark:bg-slate-900/90 dark:backdrop-blur-xl dark:border-slate-800/50 lg:static lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <Link href="/">
          <div className="flex items-center gap-3">
             <Image
              width={140}
              height={32}
              src={"/images/logo/logo-dark.svg"}
              alt="Logo"
              priority
              className="dark:hidden"
            />
             <Image
              width={140}
              height={32}
              src={"/images/logo/logo.svg"}
              alt="Logo"
              priority
              className="hidden dark:block drop-shadow-md"
            />
          </div>
        </Link>
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <FiHome className="text-xl" />
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-2 px-4 py-4 lg:mt-4 lg:px-6">
          
          <div>
            <h3 className="mb-4 ml-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Overview
            </h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              <li>
                <Link
                  href="/"
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                    pathname === "/" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                  }`}
                >
                  <FiHome className="text-xl opacity-70 group-hover:opacity-100" />
                  Dashboard
                </Link>
              </li>
              
              <li>
                <Link
                  href="/company"
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                    pathname.includes("company") && !pathname.includes("register") ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                  }`}
                >
                  <FiBriefcase className="text-xl opacity-70 group-hover:opacity-100" />
                  Companies
                </Link>
              </li>
              
              <li>
                <Link
                  href="/employee"
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                    pathname.includes("employee") && !pathname.includes("register") ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                  }`}
                >
                  <FiUsers className="text-xl opacity-70 group-hover:opacity-100" />
                  Employees
                </Link>
              </li>

              <li>
                <Link
                  href="/individual"
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                    pathname.includes("individual") ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                  }`}
                >
                  <FiUsers className="text-xl opacity-70 group-hover:opacity-100" />
                  Individuals
                </Link>
              </li>
              
              {user?.role === "partner" && (
                <li>
                  <Link
                    href="/users"
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                      pathname.includes("users") ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                    }`}
                  >
                    <FiUserPlus className="text-xl opacity-70 group-hover:opacity-100" />
                    System Users
                  </Link>
                </li>
              )}
              
              <SidebarLinkGroup activeCondition={pathname.includes("register")}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <Link
                      href="#"
                      className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                        pathname.includes("register") ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        sidebarExpanded ? handleClick() : setSidebarExpanded(true);
                      }}
                    >
                      <FiFolderPlus className="text-xl opacity-70 group-hover:opacity-100" />
                      Registration
                      <svg
                        className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current transition-transform duration-200 ${
                          open ? "rotate-180" : ""
                        }`}
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                          fill=""
                        />
                      </svg>
                    </Link>
                    <div className={`translate transform overflow-hidden ${!open ? "hidden" : ""}`}>
                      <ul className="mb-2 mt-2 flex flex-col gap-1 pl-11">
                        <li>
                          <Link
                            href="/company/register"
                            className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-sm text-slate-500 duration-300 ease-in-out hover:text-slate-800 dark:text-slate-400 dark:hover:text-white ${
                              pathname === "/company/register" ? "text-primary dark:text-primary font-semibold" : ""
                            }`}
                          >
                            New Company
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/employee/register"
                            className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-sm text-slate-500 duration-300 ease-in-out hover:text-slate-800 dark:text-slate-400 dark:hover:text-white ${
                              pathname === "/employee/register" ? "text-primary dark:text-primary font-semibold" : ""
                            }`}
                          >
                            New Employee
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 ml-4 mt-8 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Finance
            </h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              {user?.role === "partner" && (
                <li>
                  <Link
                    href="/accounts/transactions/analytics"
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                      pathname === "/accounts/transactions/analytics" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                    }`}
                  >
                    <FiPieChart className="text-xl opacity-70 group-hover:opacity-100" />
                    Analytics
                  </Link>
                </li>
              )}
              
              <li>
                <Link
                  href="/accounts/transactions/self"
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                    pathname === "/accounts/transactions/self" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                  }`}
                >
                  <FiBookOpen className="text-xl opacity-70 group-hover:opacity-100" />
                  ZAAD Records
                </Link>
              </li>

              <li>
                <Link
                  href="/accounts/transactions"
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                    pathname === "/accounts/transactions" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                  }`}
                >
                  <FiTrendingUp className="text-xl opacity-70 group-hover:opacity-100" />
                  Transactions
                </Link>
              </li>

              <li>
                <Link
                  href="/accounts/transactions/liability"
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                    pathname === "/accounts/transactions/liability" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                  }`}
                >
                  <FiTrendingDown className="text-xl opacity-70 group-hover:opacity-100" />
                  Liability
                </Link>
              </li>

              <li>
                <Link
                  href="/documents/expiry"
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                    pathname === "/documents/expiry" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                  }`}
                >
                  <FiClock className="text-xl opacity-70 group-hover:opacity-100" />
                  Expiry Documents
                </Link>
              </li>

              <SidebarLinkGroup activeCondition={pathname.includes("income") || pathname.includes("expense")}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <Link
                      href="#"
                      className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                        (pathname.includes("income") || pathname.includes("expense")) ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        sidebarExpanded ? handleClick() : setSidebarExpanded(true);
                      }}
                    >
                      <FiFolderPlus className="text-xl opacity-70 group-hover:opacity-100" />
                      Add Record
                      <svg
                        className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current transition-transform duration-200 ${
                          open ? "rotate-180" : ""
                        }`}
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                          fill=""
                        />
                      </svg>
                    </Link>
                    <div className={`translate transform overflow-hidden ${!open ? "hidden" : ""}`}>
                      <ul className="mb-2 mt-2 flex flex-col gap-1 pl-11">
                        <li>
                          <Link
                            href="/accounts/income"
                            className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-sm text-slate-500 duration-300 ease-in-out hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 ${
                              pathname.includes("income") ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""
                            }`}
                          >
                            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-lg font-bold">
                              +
                            </span>
                            Income
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/accounts/expense"
                            className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-sm text-slate-500 duration-300 ease-in-out hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 ${
                              pathname.includes("expense") ? "text-rose-600 dark:text-rose-400 font-semibold" : ""
                            }`}
                          >
                            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 text-lg font-bold">
                              -
                            </span>
                            Expense
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>
              
              <li>
                <Link
                  href="/accounts/clients"
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                    pathname.includes("clients") && !pathname.includes("register") ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                  }`}
                >
                  <FiUsers className="text-xl opacity-70 group-hover:opacity-100" />
                  Clients
                </Link>
              </li>
              
              <li>
                <Link
                  href="/accounts/invoice"
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-slate-600 duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white ${
                    pathname === "/accounts/invoice" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold shadow-sm" : ""
                  }`}
                >
                  <FiFileText className="text-xl opacity-70 group-hover:opacity-100" />
                  Invoices
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
