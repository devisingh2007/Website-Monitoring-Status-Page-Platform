"use client";

import { useState, Suspense } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { X } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-slate-50">

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Suspense fallback={
            <div className="h-dvh w-[280px] bg-white" />
          }
        >
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">

          {/* Overlay */}
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute inset-0 bg-slate-950/40"
          />

          {/* Sidebar */}
          <div className="relative h-full w-64 max-w-[85vw] shadow-xl">

            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute right-3 top-4 z-50 rounded-lg bg-white p-2 text-slate-500"
            >
              <X size={19} />
            </button>

            <Suspense
              fallback={
                <div className="h-full w-full bg-white" />
              }
            >
              <Sidebar />
            </Suspense>

          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-dvh min-w-0 lg:ml-[280px]">

        {/* Navbar */}
        <Suspense
          fallback={<div className="h-16 bg-white" />}
        >
          <Navbar onMenuClick={() => setMobileSidebarOpen(true)}/>
        </Suspense>

        {/* Page Content */}
        <main className="min-w-0 p-5 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}
