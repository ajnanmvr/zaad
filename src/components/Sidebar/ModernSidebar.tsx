"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  CreditCard,
  Receipt,
  Settings,
  ChevronRight,
  X,
  Menu,
} from "lucide-react";
import { useUserContext } from "@/contexts/UserContext";
import { cn } from "@/utils/cn";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: Array<{
    title: string;
    href: string;
  }>;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useUserContext();
  const displayName = user?.fullname || user?.username || "User";
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Transactions",
      href: "/accounts/transactions",
      icon: <Receipt className="h-5 w-5" />,
      children: [
        { title: "All Transactions", href: "/accounts/transactions" },
        { title: "Analytics", href: "/accounts/transactions/analytics" },
      ],
    },
    {
      title: "Invoices",
      href: "/accounts/invoice",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Companies",
      href: "/company",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      title: "Individuals",
      href: "/employee",
      icon: <Users className="h-5 w-5" />,
    },
    ...(user?.role === "admin"
      ? [
          {
            title: "Users",
            href: "/users",
            icon: <Users className="h-5 w-5" />,
          },
        ]
      : []),
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  // close on click outside
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

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!sidebarOpen || key !== "Escape") return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const toggleGroup = (title: string) => {
    if (expandedGroups.includes(title)) {
      setExpandedGroups(expandedGroups.filter((g) => g !== title));
    } else {
      setExpandedGroups([...expandedGroups, title]);
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebar}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 flex-col overflow-y-auto bg-white dark:bg-boxdark border-r border-stroke dark:border-strokedark transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo & Close Button */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stroke dark:border-strokedark">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-lg shadow-lg">
              Z
            </div>
            <span className="text-xl font-bold text-black dark:text-white">Zaad</span>
          </Link>

          <button
            ref={trigger}
            onClick={() => setSidebarOpen(false)}
            className="block lg:hidden text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                {displayName.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleGroup(item.title)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedGroups.includes(item.title) && "rotate-90"
                        )}
                      />
                    </button>

                    {expandedGroups.includes(item.title) && (
                      <ul className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "block rounded-lg px-4 py-2 text-sm transition-colors",
                                pathname === child.href
                                  ? "text-emerald-600 font-medium dark:text-emerald-400"
                                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                              )}
                            >
                              {child.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-stroke dark:border-strokedark p-4">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
              Need Help?
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-3">
              Contact support for assistance
            </p>
            <button className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
              Get Support
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
