import { Bell, Search, User, Moon, Sun, Laptop } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useThemeStore } from "@/store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Topbar() {
    const { theme, setTheme } = useThemeStore();

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
                        <div className="text-sm font-semibold text-slate-700 dark:text-emerald-200">Admin User</div>
                        <div className="text-xs text-slate-500 dark:text-emerald-400">Manage</div>
                    </div>
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 overflow-hidden hover:ring-2 hover:ring-brand-500/20 transition-all">
                        <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
