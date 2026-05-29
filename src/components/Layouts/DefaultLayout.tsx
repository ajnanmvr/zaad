"use client";

import { Suspense, useState } from "react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
          Loading...
        </div>
      }
    >
      <div className="relative flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.18),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(14,116,144,0.18),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(5,150,105,0.16),_transparent_40%)]" />

        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main>
            <div className="mx-auto w-full max-w-screen-2xl px-4 pb-10 pt-4 md:px-6 2xl:px-10">
              {children}
            </div>
          </main>
          </div>
      </div>
    </Suspense>
  );
}
