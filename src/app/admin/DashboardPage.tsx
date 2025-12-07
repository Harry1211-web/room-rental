"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { StatCard } from "../../components/StatCard";
import { Chart } from "../../components/Chart";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  ComposedChart,
} from "recharts";
import { useTheme } from "next-themes";

interface MonthlyStats {
  month: string;
  users: number;
  rooms: number;
  bookings: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, rooms: 0, bookings: 0, reports: 0 });
  const [chartData, setChartData] = useState<MonthlyStats[]>([]);
  const [roomStatusData, setRoomStatusData] = useState({ booked: 0, available: 0 });
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tổng số users, rooms, bookings, reports
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

  // Lấy số phòng đã đặt và chưa đặt
  useEffect(() => {
    (async () => {
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("status");

      if (error) {
        console.error("Error fetching room status:", error);
        return;
      }

      const booked = rooms?.filter(r => r.status === "booked" || r.status === "occupied").length ?? 0;
      const available = rooms?.filter(r => r.status === "available").length ?? 0;

      setRoomStatusData({ booked, available });
    })();
  }, []);

  // Lấy dữ liệu chart theo tháng
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("monthly_stats");
      setChartData(data || []);
    })();
  }, []);

  // Lấy doanh thu theo tháng
  useEffect(() => {
    (async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("created_at, total_price, status");

      if (error) {
        console.error("Error fetching bookings for revenue:", error);
        return;
      }

      const revenueByMonth: Record<string, number> = {};

      bookings?.forEach((booking) => {
        if (booking.status === "confirmed" || booking.status === "completed") {
          const date = new Date(booking.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (booking.total_price || 0);
        }
      });

      const months = Object.keys(revenueByMonth).sort();

      if (months.length === 0) {
        const currentYear = new Date().getFullYear();
        setRevenueData(
          Array.from({ length: 12 }, (_, i) => ({
            month: `${currentYear}-${String(i + 1).padStart(2, "0")}`,
            revenue: 0,
          }))
        );
        return;
      }

      const firstMonth = months[0];
      const lastMonth = months[months.length - 1];
      const [startYear] = firstMonth.split("-").map(Number);
      const [endYear, endMonth] = lastMonth.split("-").map(Number);

      const allMonths: MonthlyRevenue[] = [];
      let currentYear = startYear;
      let currentMonth = 1;

      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        const monthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
        allMonths.push({
          month: monthKey,
          revenue: revenueByMonth[monthKey] || 0,
        });

        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }

      setRevenueData(allMonths);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">

      {/* Tiêu đề */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
        📊 Dashboard
      </h1>

      {/* Thống kê tổng */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <StatCard title="Users" value={stats.users} bgColor="bg-blue-500" textColor="text-white" titleColor="text-blue-100" />
        <StatCard title="Rooms" value={stats.rooms} bgColor="bg-orange-500" textColor="text-white" titleColor="text-orange-100" />
        <StatCard title="Bookings" value={stats.bookings} bgColor="bg-green-500" textColor="text-white" titleColor="text-green-100" />
        <StatCard title="Reports" value={stats.reports} bgColor="bg-red-500" textColor="text-white" titleColor="text-red-100" />
      </div>

      {/* Biểu đồ */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Biểu đồ monthly stats */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Monthly Stats
          </h2>
          <div className="w-full h-64 sm:h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <Chart data={chartData} />
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ trạng thái phòng */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Room Status
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-6">

            {/* Pie Chart */}
            <div className="flex-1 w-full h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Available", value: roomStatusData.available },
                      { name: "Booked", value: roomStatusData.booked },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: mounted && theme === "dark" ? "#1f2937" : "#ffffff",
                      border: mounted && theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: mounted && theme === "dark" ? "#ffffff" : "#000000",
                    }}
                    labelStyle={{
                      color: mounted && theme === "dark" ? "#ffffff" : "#000000",
                    }}
                    itemStyle={{
                      color: mounted && theme === "dark" ? "#ffffff" : "#000000",
                    }}
                    formatter={(value: number) => [value, "Rooms"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 shrink-0">
              <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Legend</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-[#10b981]"></div>
                  <span className="text-sm text-gray-900 dark:text-gray-100">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-[#f59e0b]"></div>
                  <span className="text-sm text-gray-900 dark:text-gray-100">Booked</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Biểu đồ doanh thu */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Monthly Revenue
        </h2>
        <div className="w-full h-64 sm:h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={revenueData}
              margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={mounted && theme === "dark" ? "#ffffff33" : "#e5e7eb"}
              />
              <XAxis
                dataKey="month"
                interval={0} // always show all ticks
                tick={{ fill: mounted && theme === "dark" ? "#fff" : "#000", fontSize: 12 }}
                angle={-45} // rotate labels for small screens
                textAnchor="end"
              />
              <YAxis
                tick={{ fill: mounted && theme === "dark" ? "#fff" : "#000", fontSize: 12 }}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: mounted && theme === "dark" ? "#1f2937" : "#fff",
                  border: mounted && theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#3b82f6" />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
