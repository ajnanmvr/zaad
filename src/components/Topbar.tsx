import { Bell, Search, User, Moon, Sun, Laptop, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useThemeStore } from "@/store";
import { useAuthStore } from "@/store/auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Topbar() {
    const navigate = useNavigate();
    const { theme, setTheme } = useThemeStore();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <header className="h-16 bg-white/80 dark:bg-emerald-950/50 backdrop-blur-md border-b border-emerald-100/80 dark:border-emerald-900/60 sticky top-0 z-20 px-6 flex items-center justify-between transition-colors duration-300">
            <div className="flex-1 max-w-md">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <Input
                        placeholder="Search anything..."
                        className="pl-10 bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 focus:bg-white dark:focus:bg-emerald-900/30 transition-all duration-300 rounded-full"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-slate-500 dark:text-slate-300 hover:text-brand-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full h-9 w-9">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-emerald-950">
                        <DropdownMenuItem onClick={() => setTheme("light")} className="dark:hover:bg-emerald-900/30">
                            <Sun className="mr-2 h-4 w-4" /> 
                            <span>Light</span>
                            {theme === "light" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")} className="dark:hover:bg-emerald-900/30">
                            <Moon className="mr-2 h-4 w-4" /> 
                            <span>Dark</span>
                            {theme === "dark" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")} className="dark:hover:bg-emerald-900/30">
                            <Laptop className="mr-2 h-4 w-4" /> 
                            <span>System</span>
                            {theme === "system" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" className="relative text-slate-500 dark:text-slate-300 hover:text-brand-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full h-9 w-9">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-emerald-950"></span>
                </Button>
                <div className="h-8 w-px bg-emerald-200 dark:bg-emerald-800 mx-1"></div>
                <div className="flex items-center gap-3 pl-1">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-semibold text-slate-700 dark:text-emerald-200">
                            {user?.name || "User"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-emerald-400">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(user as any)?.role || "User"}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-slate-500 dark:text-slate-300 hover:text-brand-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full h-9 w-9"
                            >
                                <User className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-emerald-950 w-56">
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-emerald-900">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {user?.name || "User"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {user?.email}
                                </p>
                            </div>
                            <DropdownMenuItem
                                onClick={() => navigate("/profile")}
                                className="dark:hover:bg-emerald-900/30"
                            >
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => navigate("/settings")}
                                className="dark:hover:bg-emerald-900/30"
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-emerald-900/30" />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="text-red-600 dark:text-red-400 dark:hover:bg-emerald-900/30"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
