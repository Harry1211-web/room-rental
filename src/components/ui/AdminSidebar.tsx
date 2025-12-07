"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface AdminSidebarProps {
  tab: string;
  setTab: (tab: string) => void;
}

export default function AdminSidebar({ tab, setTab }: AdminSidebarProps) {
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

  // 🔁 Khi tab thay đổi → cập nhật URL (nhưng không reload)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  }, [tab]);

  return (
    <aside className="fixed left-0 top-16 w-56 bg-white dark:bg-gray-900 shadow-md border-r dark:border-gray-700 z-40 flex flex-col transition-colors duration-300" style={{ height: 'calc(100vh - 4rem)' }}>
      <h2 className="text-xl font-bold h-20 border-b dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 sticky top-0 z-10 shrink-0 transition-colors duration-300 flex items-center justify-center">Admin</h2>
      <nav className="flex flex-col overflow-y-auto flex-1 min-h-0">
        {menu.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
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
  );
}
