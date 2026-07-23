"use client";

import { Suspense, useState } from "react";
import Image from "next/image";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { useUserContext } from "@/contexts/UserContext";

function AppLoadingScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-slate-100 dark:bg-slate-950">
      <div className="relative flex items-center justify-center">
        <span className="absolute h-20 w-20 animate-ping rounded-full bg-green-800/20 dark:bg-cyan-500/15" />
          <Image
            src="/images/logo/logo-icon.svg"
            alt="Logo"
            width={50}
            height={50}
            className="block dark:hidden"
            priority
          />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="h-1 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full w-full origin-left animate-[shimmer_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-green-800 to-transparent dark:via-green-500" />
        </div>
      </div>
    </div>
  );
}

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isUserLoading } = useUserContext();

  if (isUserLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <Suspense fallback={<AppLoadingScreen />}>
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
