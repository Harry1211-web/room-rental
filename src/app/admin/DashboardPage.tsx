"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { StatCard } from "../../components/StatCard";
import { Chart } from "../../components/Chart";

interface MonthlyStats {
  month: string;
  users: number;
  rooms: number;
  bookings: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, rooms: 0, bookings: 0, reports: 0 });
  const [chartData, setChartData] = useState<MonthlyStats[]>([]);

  // tổng số users, rooms, bookings, reports
  useEffect(() => {
    (async () => {
      const [u, r, b, rep] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        users: u.count ?? 0,
        rooms: r.count ?? 0,
        bookings: b.count ?? 0,
        reports: rep.count ?? 0,
      });
    })();
  }, []);

  // dữ liệu chart theo tháng
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("monthly_stats");
      setChartData(data || []);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📊 Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Users" value={stats.users} />
        <StatCard title="Rooms" value={stats.rooms} />
        <StatCard title="Bookings" value={stats.bookings} />
        <StatCard title="Reports" value={stats.reports} />
      </div>

      <Chart data={chartData} />
    </div>
  );
}
