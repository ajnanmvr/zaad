"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FiCalendar,
  FiBookOpen,
  FiBriefcase,
  FiCheckCircle,
  FiRepeat,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiFolderPlus,
  FiHome,
  FiKey,
  FiLayers,
  FiLock,
  FiPieChart,
  FiSettings,
  FiShield,
  FiTrendingDown,
  FiTrendingUp,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { useUserContext } from "@/contexts/UserContext";
import SidebarLinkGroup from "./SidebarLinkGroup";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
};

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-cyan-50 text-cyan-700 shadow-sm ring-1 ring-cyan-200 dark:bg-cyan-500/12 dark:text-cyan-300 dark:ring-cyan-500/30"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
      }`}
    >
      <span className="text-lg opacity-80 group-hover:opacity-100">{icon}</span>
      {label}
    </Link>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="mb-3 ml-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
      {title}
    </h3>
  );
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const can = (permission: string) =>
    Array.isArray(user?.permissions) &&
    (user?.permissions as string[]).includes(permission);

  const trigger = useRef<HTMLButtonElement | null>(null);
  const sidebar = useRef<HTMLElement | null>(null);

  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      ) {
        return;
      }
      setSidebarOpen(false);
    };

    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!sidebarOpen || key !== "Escape") return;
      setSidebarOpen(false);
    };

    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [sidebarOpen, setSidebarOpen]);

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
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden border-r border-slate-200/70 bg-white/85 shadow-2xl shadow-slate-200/40 backdrop-blur-xl duration-300 ease-linear dark:border-slate-800/70 dark:bg-slate-900/90 dark:shadow-none lg:static lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/80">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              width={140}
              height={32}
              src="/images/logo/logo-dark.svg"
              alt="Logo"
              priority
              className="dark:hidden"
            />
            <Image
              width={140}
              height={32}
              src="/images/logo/logo.svg"
              alt="Logo"
              priority
              className="hidden dark:block drop-shadow-md"
            />
          </Link>

          <button
            ref={trigger}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            className="block rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
          >
            <FiX className="text-xl" />
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto px-4 py-4">
        <nav className="space-y-7">
          <div>
            <SectionTitle title="Workspace" />
            <ul className="space-y-1.5">
              <li>
                <NavItem
                  href="/"
                  icon={<FiHome />}
                  label="Dashboard"
                  active={pathname === "/"}
                />
              </li>
              {(can("tasks.read") || can("tasks.complete") || can("tasks.manage")) && (
                <li>
                  <NavItem
                    href="/tasks"
                    icon={<FiCalendar />}
                    label="My Tasks"
                    active={pathname === "/tasks"}
                  />
                </li>
              )}
              {can("tasks.manage") && (
                <li>
                  <NavItem
                    href="/tasks/manage"
                    icon={<FiCheckCircle />}
                    label="Task Management"
                    active={pathname === "/tasks/manage"}
                  />
                </li>
              )}
            </ul>
          </div>

          <div>
            <SectionTitle title="Entities" />
            <ul className="space-y-1.5">
              <li>
                <NavItem
                  href="/company"
                  icon={<FiBriefcase />}
                  label="Companies"
                  active={
                    pathname.startsWith("/company") &&
                    !pathname.includes("register")
                  }
                />
              </li>
              <li>
                <NavItem
                  href="/employee"
                  icon={<FiUsers />}
                  label="Employees"
                  active={
                    pathname.startsWith("/employee") &&
                    !pathname.includes("register")
                  }
                />
              </li>
              <li>
                <NavItem
                  href="/individual"
                  icon={<FiUsers />}
                  label="Individuals"
                  active={pathname.startsWith("/individual")}
                />
              </li>

              <SidebarLinkGroup activeCondition={pathname.includes("register")}>
                {(handleClick, open) => (
                  <>
                    <Link
                      href="#"
                      className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        pathname.includes("register")
                          ? "bg-cyan-50 text-cyan-700 shadow-sm ring-1 ring-cyan-200 dark:bg-cyan-500/12 dark:text-cyan-300 dark:ring-cyan-500/30"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                      }`}
                      onClick={(event) => {
                        event.preventDefault();
                        sidebarExpanded
                          ? handleClick()
                          : setSidebarExpanded(true);
                      }}
                    >
                      <FiFolderPlus className="text-lg opacity-80" />
                      Add Entity
                      <FiChevronRight
                        className={`ml-auto text-base transition-transform ${open ? "rotate-90" : ""}`}
                      />
                    </Link>
                    <div className={`${open ? "mt-2 block" : "hidden"}`}>
                      <ul className="ml-6 space-y-1 border-l border-slate-200 pl-4 dark:border-slate-700">
                        <li>
                          <NavItem
                            href="/company/register"
                            icon={<FiLayers />}
                            label="New Company"
                            active={pathname === "/company/register"}
                          />
                        </li>
                        <li>
                          <NavItem
                            href="/employee/register"
                            icon={<FiUserPlus />}
                            label="New Employee"
                            active={pathname === "/employee/register"}
                          />
                        </li>
                        <li>
                          <NavItem
                            href="/individual/register"
                            icon={<FiUsers />}
                            label="New Individual"
                            active={pathname === "/individual/register"}
                          />
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </SidebarLinkGroup>
            </ul>
          </div>

          <div>
            <SectionTitle title="Documents" />
            <ul className="space-y-1.5">
              <li>
                <NavItem
                  href="/documents/expiry"
                  icon={<FiClock />}
                  label="Expiry Documents"
                  active={pathname === "/documents/expiry"}
                />
              </li>
              <li>
                <NavItem
                  href="/documents/handover"
                  icon={<FiFileText />}
                  label="Physical Handover"
                  active={pathname === "/documents/handover"}
                />
              </li>
            </ul>
          </div>

          <div>
            <SectionTitle title="Finance" />
            <ul className="space-y-1.5">
              {can("payments.read") && (
                <li>
                  <NavItem
                    href="/accounts/transactions/analytics"
                    icon={<FiPieChart />}
                    label="Analytics"
                    active={pathname === "/accounts/transactions/analytics"}
                  />
                </li>
              )}
              <li>
                <NavItem
                  href="/accounts/transactions"
                  icon={<FiTrendingUp />}
                  label="All Transactions"
                  active={pathname === "/accounts/transactions"}
                />
              </li>
              <li>
                <NavItem
                  href="/accounts/transactions/self"
                  icon={<FiBookOpen />}
                  label="Company Records"
                  active={pathname === "/accounts/transactions/self"}
                />
              </li>
              <li>
                <NavItem
                  href="/accounts/transactions/self-deposit"
                  icon={<FiRepeat />}
                  label="Self Deposit"
                  active={pathname === "/accounts/transactions/self-deposit"}
                />
              </li>
              <li>
                <NavItem
                  href="/accounts/transactions/liability"
                  icon={<FiTrendingDown />}
                  label="Liability"
                  active={pathname === "/accounts/transactions/liability"}
                />
              </li>
              <li>
                <NavItem
                  href="/accounts/transactions/credit-debit"
                  icon={<FiCreditCard />}
                  label="Credit / Debit"
                  active={pathname === "/accounts/transactions/credit-debit"}
                />
              </li>
              <li>
                <NavItem
                  href="/accounts/invoice"
                  icon={<FiFileText />}
                  label="Invoices"
                  active={pathname === "/accounts/invoice"}
                />
              </li>
            </ul>
          </div>

          <div>
            <SectionTitle title="Settings & Access" />
            <ul className="space-y-1.5">
              <li>
                <NavItem
                  href="/settings"
                  icon={<FiSettings />}
                  label="Settings Home"
                  active={pathname === "/settings"}
                />
              </li>
              {can("entities.write") && (
                <SidebarLinkGroup
                  activeCondition={
                    pathname.startsWith("/settings/document-types") ||
                    pathname.startsWith("/settings/credential-platforms") ||
                    pathname.startsWith("/settings/payment-methods") ||
                    pathname.startsWith("/settings/payment-statuses") ||
                    pathname.startsWith("/settings/templates") ||
                    pathname.startsWith("/settings/particular-suggestions")
                  }
                >
                  {(handleClick, open) => (
                    <>
                      <Link
                        href="#"
                        className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          pathname.startsWith("/settings/document-types") ||
                          pathname.startsWith("/settings/credential-platforms") ||
                          pathname.startsWith("/settings/payment-methods") ||
                          pathname.startsWith("/settings/payment-statuses") ||
                          pathname.startsWith("/settings/templates") ||
                          pathname.startsWith("/settings/particular-suggestions")
                            ? "bg-cyan-50 text-cyan-700 shadow-sm ring-1 ring-cyan-200 dark:bg-cyan-500/12 dark:text-cyan-300 dark:ring-cyan-500/30"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                        }`}
                        onClick={(event) => {
                          event.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <FiLock className="text-lg opacity-80" />
                        Types & Platforms
                        <FiChevronRight
                          className={`ml-auto text-base transition-transform ${open ? "rotate-90" : ""}`}
                        />
                      </Link>
                      <div className={`${open ? "mt-2 block" : "hidden"}`}>
                        <ul className="ml-6 space-y-1 border-l border-slate-200 pl-4 dark:border-slate-700">
                          <li>
                            <NavItem
                              href="/settings/document-types"
                              icon={<FiLayers />}
                              label="Document Types"
                              active={pathname === "/settings/document-types"}
                            />
                          </li>
                          <li>
                            <NavItem
                              href="/settings/credential-platforms"
                              icon={<FiFileText />}
                              label="Credential Platforms"
                              active={pathname === "/settings/credential-platforms"}
                            />
                          </li>
                          <li>
                            <NavItem
                              href="/settings/payment-methods"
                              icon={<FiCreditCard />}
                              label="Payment Methods"
                              active={pathname === "/settings/payment-methods"}
                            />
                          </li>
                          <li>
                            <NavItem
                              href="/settings/payment-statuses"
                              icon={<FiCheckCircle />}
                              label="Payment Statuses"
                              active={pathname === "/settings/payment-statuses"}
                            />
                          </li>
                          <li>
                            <NavItem
                              href="/settings/particular-suggestions"
                              icon={<FiFileText />}
                              label="Particular Suggestions"
                              active={pathname === "/settings/particular-suggestions"}
                            />
                          </li>
                        </ul>
                      </div>
                    </>
                  )}
                </SidebarLinkGroup>
              )}
              {(can("roles.manage") || can("settings.read")) && (
                <li>
                  <NavItem
                    href="/settings/roles"
                    icon={<FiShield />}
                    label="Role Management"
                    active={pathname === "/settings/roles"}
                  />
                </li>
              )}
              {can("settings.read") && (
                <li>
                  <NavItem
                    href="/settings/roles"
                    icon={<FiShield />}
                    label="Permission Overview"
                    active={pathname === "/settings/roles"}
                  />
                </li>
              )}
            </ul>
          </div>

          {can("users.read") && (
            <div>
              <SectionTitle title="Administration" />
              <ul className="space-y-1.5">
                <li>
                  <NavItem
                    href="/users"
                    icon={<FiUserPlus />}
                    label="System Users"
                    active={pathname.startsWith("/users")}
                  />
                </li>
              </ul>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
