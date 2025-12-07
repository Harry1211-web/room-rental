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

  // Sum of users, rooms, bookings, reports
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

  // Get the number of rooms booked and available
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

  // Data for the chart by month
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("monthly_stats");
      setChartData(data || []);
    })();
  }, []);

  // Get revenue by month
  useEffect(() => {
    (async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("created_at, total_price, status");
      
      if (error) {
        console.error("Error fetching bookings for revenue:", error);
        return;
      }

      // Group revenue by month
      const revenueByMonth: Record<string, number> = {};
      
      bookings?.forEach((booking) => {
        if (booking.status === "confirmed" || booking.status === "completed") {
          const date = new Date(booking.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const price = booking.total_price || 0;
          revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + price;
        }
      });

      // Find the first and last year with data
      const months = Object.keys(revenueByMonth).sort((a, b) => a.localeCompare(b));
      
      if (months.length === 0) {
        // If there is no data, display 12 months of the current year
        const currentYear = new Date().getFullYear();
        const allMonths: MonthlyRevenue[] = [];
        for (let month = 1; month <= 12; month++) {
          allMonths.push({
            month: `${currentYear}-${String(month).padStart(2, "0")}`,
            revenue: 0,
          });
        }
        setRevenueData(allMonths);
        return;
      }

      const firstMonth = months[0];
      const lastMonth = months[months.length - 1];
      const [startYear] = firstMonth.split("-").map(Number);
      const [endYear, endMonth] = lastMonth.split("-").map(Number);
      
      // Create an array containing all months from the first month of the first year to the last month of the last year with data
      const allMonths: MonthlyRevenue[] = [];
      let currentYear = startYear;
      let currentMonth = 1; // Start from the first month of the first year
      
      while (
        currentYear < endYear || 
        (currentYear === endYear && currentMonth <= endMonth)
      ) {
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📊 Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Users" 
          value={stats.users} 
          bgColor="bg-blue-500"
          textColor="text-white"
          titleColor="text-blue-100"
        />
        <StatCard 
          title="Rooms" 
          value={stats.rooms} 
          bgColor="bg-orange-500"
          textColor="text-white"
          titleColor="text-orange-100"
        />
        <StatCard 
          title="Bookings" 
          value={stats.bookings} 
          bgColor="bg-green-500"
          textColor="text-white"
          titleColor="text-green-100"
        />
        <StatCard 
          title="Reports" 
          value={stats.reports} 
          bgColor="bg-red-500"
          textColor="text-white"
          titleColor="text-red-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart data={chartData} />
        
        {/* Donut Chart for Room Status */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm transition-colors">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Room Status</h2>
          <div className="flex items-center gap-8 pr-4">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Available", value: roomStatusData.available },
                      { name: "Booked", value: roomStatusData.booked },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
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
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 shrink-0">
              <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Room Status</h3>
              <div className="flex flex-col gap-3">
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

      {/* Bar Chart for Monthly Revenue */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm transition-colors">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Monthly Revenue</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke={mounted && theme === "dark" ? "#ffffff33" : "#e5e7eb"} />
            <XAxis 
              dataKey="month" 
              tick={{ fill: mounted && theme === "dark" ? "#ffffff" : "#000000" }}
              style={{ fill: mounted && theme === "dark" ? "#ffffff" : "#000000" }}
            />
            <YAxis 
              tick={{ fill: mounted && theme === "dark" ? "#ffffff" : "#000000" }}
              style={{ fill: mounted && theme === "dark" ? "#ffffff" : "#000000" }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: mounted && theme === "dark" ? "#1f2937" : "#ffffff",
                border: mounted && theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb",
                borderRadius: "8px",
                color: mounted && theme === "dark" ? "#ffffff" : "#000000",
              }}
              labelStyle={{ color: mounted && theme === "dark" ? "#ffffff" : "#000000" }}
              itemStyle={{ color: mounted && theme === "dark" ? "#ffffff" : "#000000" }}
              formatter={(value: number, name: string) => {
                if (name === "Trend") return null;
                return [`$${value.toLocaleString()}`, "Revenue"];
              }}
            />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 6 }}
              name="Trend"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
