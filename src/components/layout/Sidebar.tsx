"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Monitor,
  AlertTriangle,
  History,
  Settings,
  ChevronLeft,
} from "lucide-react";

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "MONITORING",
    items: [
      {
        name: "Projects",
        href: "/projects",
        icon: FolderKanban,
      },
      {
        name: "Monitors",
        href: "/monitors",
        icon: Monitor,
      },
      {
        name: "Incidents",
        href: "/incidents",
        icon: AlertTriangle,
      },
      {
        name: "Check History",
        href: "/history",
        icon: History,
      },
    ],
  },
  {
    title: "PREFERENCES",
    items: [
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-70 shrink-0 flex-col border-r border-slate-200 bg-white">


      <div className="flex h-17.5 shrink-0 items-center justify-between border-b border-slate-200 px-5">

        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3"
        >
          <div className="relative h-11 w-11 shrink-0">
            <Image
              src="/ArgusSiteSentinel-logo.png"
              alt="ArgusSiteSentinel logo"
              fill
              priority
              sizes="44px"
              className="object-contain"
            />
          </div>

          <span className="truncate text-[17px] font-bold tracking-tight text-slate-900">
            ArgusSiteSentinel
          </span>
        </Link>

        <button
          type="button"
          aria-label="Collapse sidebar"
          className="ml-2 shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronLeft size={19} />
        </button>
      </div>

      
      <nav className="flex-1 space-y-7 overflow-y-auto px-4.25 py-6">

        {navigation.map((group) => (
          <div key={group.title}>

            <p className="mb-3 px-3 text-[11px] font-semibold tracking-wider text-slate-400">
              {group.title}
            </p>

            <div className="space-y-1">

              {group.items.map((item) => {
                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      size={19}
                      strokeWidth={1.8}
                      className="shrink-0"
                    />

                    <span>{item.name}</span>

                    {item.name === "Incidents" && (
                      <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                        0
                      </span>
                    )}
                  </Link>
                );
              })}

            </div>
          </div>
        ))}

      </nav>

      
      <div className="shrink-0 border-t border-slate-200 p-4.25">

        <div className="rounded-xl bg-slate-50 p-3">

          <p className="text-xs font-semibold text-slate-800">
            ArgusSiteSentinel
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Website Monitoring Platform
          </p>

         
        </div>
      </div>

    </aside>
  );
}
