import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            {/* Background decorations */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/10 dark:bg-brand-900/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[100px]" />
            </div>

            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 z-10 transition-all duration-300 ease-in-out ml-0 md:pl-0">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth bg-transparent">
                    <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
