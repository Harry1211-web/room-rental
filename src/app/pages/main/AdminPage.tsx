"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/ui/AdminSidebar";
import UsersPage from "@/app/admin/UsersPage";
import RoomsPage from "@/app/admin/RoomsPage";
import VerificationsPage from "@/app/admin/VerificationsPage";
import ReportsPage from "@/app/admin/ReportsPage";
import ReviewsPage from "@/app/admin/ReviewsPage";
import DashboardPage from "@/app/admin/DashboardPage";

export default function AdminPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "users";
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const paramTab = searchParams.get("tab");
    if (paramTab && paramTab !== tab) setTab(paramTab);
  }, [searchParams]);

  return (
    <div className="flex">
      <AdminSidebar tab={tab} setTab={setTab} />
      <main className="flex-1 p-6 ml-56">
        {tab === "users" && <UsersPage />}
        {tab === "rooms" && <RoomsPage />}
        {tab === "verify" && <VerificationsPage />}
        {tab === "report" && <ReportsPage />}
        {tab === "review" && <ReviewsPage />}
        {tab === "dash" && <DashboardPage />}
      </main>
    </div>
  );
}
