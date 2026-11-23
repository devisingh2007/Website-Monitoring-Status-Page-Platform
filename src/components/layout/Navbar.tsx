
"use client";

import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Menu,
} from "lucide-react";

interface NavbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/monitors": "Monitors",
  "/incidents": "Incidents",
  "/history": "Check History",
  "/settings": "Settings",
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();

  const pageTitle =
    pageTitles[pathname] ||
    (pathname.startsWith("/monitors/") ? "Monitor Details" : "Overview");

  return (
    <header className="sticky top-0 z-30 flex h-[70px] w-full items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">

      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-3">

        {/* Mobile Menu */}
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu size={21} />
        </button>

        {/* Page Title */}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-900">
            {pageTitle}
          </h1>

          <p className="hidden text-xs text-slate-500 sm:block">
            Welcome to ArgusSiteSentinel
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">

        {/* Search */}
       

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* Admin Profile */}
        <button
          type="button"
          aria-label="Admin workspace menu"
          className="flex shrink-0 items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            AS
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-slate-800">
              Admin
            </p>

            <p className="text-xs text-slate-500">
              Workspace
            </p>
          </div>

          <ChevronDown
            size={16}
            className="hidden text-slate-400 sm:block"
          />
        </button>

      </div>
    </header>
  );
}
