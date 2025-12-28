"use client";
import React, { useState } from "react";
import ModernSidebar from "@/components/Sidebar/ModernSidebar";
import ModernHeader from "@/components/Header/ModernHeader";

export default function ModernLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-boxdark-2">
      {/* Sidebar */}
      <ModernSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content Area */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <ModernHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
