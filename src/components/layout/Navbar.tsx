"use client";

import { usePathname } from "next/navigation";
import {Search,Bell,ChevronDown,Menu} from "lucide-react";
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">


      <div className="flex items-center gap-3">
        <button
  type="button"
  aria-label="Open navigation menu"
  onClick={onMenuClick}
  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
>
  <Menu size={21} />
</button>

        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {pageTitle}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Welcome to ArgusSiteSentinel
          </p>
        </div>
      </div>


      <div className="flex items-center gap-3 sm:gap-5">


        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search size={17} className="text-slate-400" />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search"
            className="w-36 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 lg:w-48"
          />

        </div>


        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
        </button>


        <div className="hidden h-8 w-px bg-slate-200 sm:block" />


        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-50"
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
