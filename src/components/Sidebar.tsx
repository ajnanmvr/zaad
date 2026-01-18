import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    Users,
    FileText,
    Receipt,
    CheckSquare,
    CreditCard,

    ChevronLeft,
    ChevronRight,
    Menu,
    Calendar,
    UserCog
} from "lucide-react";
import { Button } from "./ui/button";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/companies", label: "Companies", icon: Building2 },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/documents/expiring", label: "Expiring Docs", icon: FileText },
    { href: "/zaad-expenses", label: "Office Expenses", icon: Receipt },
    { href: "/users", label: "Users", icon: UserCog },
    { href: "/invoices", label: "Invoices", icon: Receipt },

    { href: "/records", label: "Records", icon: CreditCard },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/liabilities", label: "Liabilities", icon: CreditCard },
];

export default function Sidebar() {
    const { pathname } = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-white/90 dark:bg-emerald-950/40 backdrop-blur-md border-r border-emerald-100/80 dark:border-emerald-900/60 shadow-xl md:shadow-none transition-all duration-300 ease-in-out",
                    collapsed ? "w-16" : "w-64",
                    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-100 dark:border-emerald-900/50">
                    {!collapsed && (
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-brand-700 dark:text-brand-400">
                            <img src="/logo.svg" alt="Zaad Logo" className="w-8 h-8" />
                            <span className="bg-clip-text text-transparent bg-linear-to-r from-brand-700 to-brand-500 dark:from-brand-400 dark:to-brand-200">
                                Zaad<span className="text-slate-400 font-light">Sys</span>
                            </span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="mx-auto w-10 h-10 flex items-center justify-center">
                            <img src="/logo.svg" alt="Zaad Logo" className="w-8 h-8" />
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex ml-auto text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full w-8 h-8"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden ml-auto"
                        onClick={() => setMobileOpen(false)}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                title={collapsed ? item.label : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden text-sm",
                                    isActive
                                        ? "text-brand-700 bg-brand-50 shadow-sm font-medium dark:bg-emerald-900/30 dark:text-emerald-300"
                                        : "text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                                )}
                                onClick={() => setMobileOpen(false)}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full" />
                                )}
                                <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 group-hover:text-brand-500")} />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </div>

                {/* Footer */}

            </aside>

            {/* Mobile Toggle Button (Fixed) */}
            {!mobileOpen && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed bottom-4 right-4 z-50 md:hidden bg-brand-600 text-white shadow-lg rounded-full w-12 h-12 hover:bg-brand-700"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu className="w-6 h-6" />
                </Button>
            )}
        </>
    );
}
