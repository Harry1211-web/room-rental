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
    <aside className="fixed left-0 top-0 h-full w-56 bg-white shadow-md border-r z-40 pt-16">
      <h2 className="text-xl font-bold p-4 border-b">🧭 Admin</h2>
      <nav className="flex flex-col">
        {menu.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`text-left px-4 py-2 transition ${
              tab === item.key ? "bg-blue-500 text-white" : "hover:bg-gray-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
