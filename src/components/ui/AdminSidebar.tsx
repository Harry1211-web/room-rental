"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface AdminSidebarProps {
  tab: string;
  setTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({
  tab,
  setTab,
  sidebarOpen,
  setSidebarOpen,
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const menu = [
    { key: "dash", label: "📊 Dashboard" },
    { key: "users", label: "👥 Users" },
    { key: "rooms", label: "🏠 Rooms" },
    { key: "verify", label: "✅ Verifications" },
    { key: "report", label: "📋 Reports" },
    { key: "review", label: "⭐ Reviews" },
  ];

  // Update URL query when tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  }, [tab]);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-56 bg-white dark:bg-gray-900 shadow-md border-r dark:border-gray-700 z-40 flex flex-col
          transition-transform transform duration-300
          md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <h2 className="text-xl font-bold h-20 border-b dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 sticky top-0 z-10 shrink-0 flex items-center justify-center">
          Admin
        </h2>

        <nav className="flex flex-col overflow-y-auto flex-1 min-h-0">
          {menu.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setTab(item.key);
                setSidebarOpen(false); // Close sidebar on mobile after click
              }}
              className={`text-left px-4 py-2 transition shrink-0 ${
                tab === item.key
                  ? "bg-blue-500 dark:bg-blue-600 text-white"
                  : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
