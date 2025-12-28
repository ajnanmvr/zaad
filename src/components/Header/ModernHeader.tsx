"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Menu, 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  LogOut,
  User,
  Settings
} from "lucide-react";
import { useUserContext } from "@/contexts/UserContext";
import useColorMode from "@/hooks/useColorMode";
import { cn } from "@/utils/cn";
import { Button } from "../ui/Button";

interface ModernHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const ModernHeader = ({ sidebarOpen, setSidebarOpen }: ModernHeaderProps) => {
  const { user } = useUserContext();
  const displayName = user?.fullname || user?.username || "User";
  const userInitial = displayName.charAt(0).toUpperCase();
  const [colorMode, setColorMode] = useColorMode();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifications = [
    {
      id: 1,
      title: "New invoice created",
      message: "Invoice #1234 has been created",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "Payment received",
      message: "Payment of 5000 AED received",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      title: "Document expiring soon",
      message: "Company license expiring in 7 days",
      time: "3 hours ago",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 flex w-full bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        {/* Left side - Menu button */}
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Center - Search */}
        <div className="hidden sm:block flex-1 max-w-xl">
          <div className="relative">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-3 rounded-lg border border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800 px-4 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search transactions, invoices...</span>
              <kbd className="ml-auto hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-stroke dark:border-strokedark bg-white dark:bg-boxdark px-1.5 font-mono text-xs font-medium text-gray-600 dark:text-gray-400">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search button (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setColorMode(colorMode === "light" ? "dark" : "light")}
            aria-label="Toggle dark mode"
          >
            {colorMode === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-lg animate-scale-in">
                <div className="border-b border-stroke dark:border-strokedark p-4">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={cn(
                        "w-full border-b border-stroke dark:border-strokedark p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                        notification.unread && "bg-emerald-50/30 dark:bg-emerald-900/10"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black dark:text-white truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                        {notification.unread && (
                          <div className="h-2 w-2 rounded-full bg-emerald-600 mt-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-stroke dark:border-strokedark p-3">
                  <button className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 p-2 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                {userInitial || "U"}
              </div>
              <span className="hidden md:block text-sm font-medium text-black dark:text-white">
                {displayName}
              </span>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-lg animate-scale-in">
                <div className="border-b border-stroke dark:border-strokedark p-3">
                  <p className="text-sm font-semibold text-black dark:text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {user?.role}
                  </p>
                </div>
                <div className="p-2">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>
                <div className="border-t border-stroke dark:border-strokedark p-2">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red hover:bg-red/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-20 animate-fade-in"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl mx-4 bg-white dark:bg-boxdark rounded-lg shadow-xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-stroke dark:border-strokedark px-4 py-3">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions, invoices, companies..."
                className="flex-1 bg-transparent outline-none text-sm text-black dark:text-white placeholder:text-gray-400"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800 px-1.5 font-mono text-xs font-medium text-gray-600 dark:text-gray-400">
                ESC
              </kbd>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start typing to search...
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default ModernHeader;
