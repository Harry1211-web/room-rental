"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { X, Menu } from "lucide-react"; // For toggle icons
import AdminSidebar from "@/components/ui/AdminSidebar";
import UsersPage from "@/app/admin/UsersPage";
import RoomsPage from "@/app/admin/RoomsPage";
import VerificationsPage from "@/app/admin/VerificationsPage";
import ReportsPage from "@/app/admin/ReportsPage";
import ReviewsPage from "@/app/admin/ReviewsPage";
import DashboardPage from "@/app/admin/DashboardPage";
import Banana from "../test/page";

export default function AdminPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "users";
  const [tab, setTab] = useState(initialTab);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync URL tab param with state
  useEffect(() => {
    const paramTab = searchParams.get("tab");
    if (paramTab && paramTab !== tab) setTab(paramTab);
  }, [searchParams]);

  return (
    <div className="flex">
      {/* Sidebar */}
      <AdminSidebar
        tab={tab}
        setTab={setTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <main className="flex-1 p-6 md:ml-56 relative">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden mb-4 px-3 py-2 bg-gray-700 text-white rounded flex items-center justify-center"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Pages */}
        {tab === "users" && <UsersPage />}
        {tab === "rooms" && <RoomsPage />}
        {tab === "verify" && <VerificationsPage />}
        {tab === "report" && <ReportsPage />}
        {tab === "review" && <ReviewsPage />}
        {tab === "dash" && <DashboardPage />}
      </main>

      <Banana />
    </div>
  );
}
