import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/app/context/Usercontext";
import { Loader } from "@/components/Loader";
import { RoomCarousel } from "@/components/RoomCarousel";
// 1. Import necessary components for the chart
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
} from "recharts";
import { useTheme } from "next-themes";

interface Room {
  id: string;
  title: string;
  city: string;
  price: number;
  area?: string;
  avg_rating?: number;
  totalbooking?: number;
  images?: string[];
  tags?: string[];
}

// 2. Define the interface for Monthly Revenue data
interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export default function RecommendPage() {
  const [topBooked, setTopBooked] = useState<Room[]>([]);
  const [topRated, setTopRated] = useState<Room[]>([]);
  const [hotThisMonth, setHotThisMonth] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRooms, setShowRooms] = useState(false);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]); // 3. State for revenue data
  const [mounted, setMounted] = useState(false); // 4. State for theme mounting
  const { theme } = useTheme();
  
  const { setLoading, role } = useUser(); // 5. Get user role

  useEffect(() => {
    setMounted(true);
  }, []);

  // 6. Extracted logic from DashboardPage for fetching revenue data
  const fetchRevenueData = useCallback(async () => {
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
  }, []);

  // Fetch recommended rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);

        // Remove the generic type from rpc calls
        const [booked, rated, hot] = await Promise.all([
          supabase.rpc("rpc_top_booked_rooms"),
          supabase.rpc("rpc_top_rated_rooms"),
          supabase.rpc("rpc_hot_rooms_this_month"),
        ]);

        // Update states with proper typing
        setTopBooked((booked.data as Room[]) ?? []);
        setTopRated((rated.data as Room[]) ?? []);
        setHotThisMonth((hot.data as Room[]) ?? []);
        setShowRooms(true);

        // 7. Only fetch revenue data if the user is a landlord
        if (role === "landlord") {
          await fetchRevenueData();
        }

      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    fetchRooms();
  }, [setLoading, role, fetchRevenueData]); // 8. Dependency on role and fetchRevenueData

  // Show loader until both data and image are loaded
  const shouldShowLoader = isLoading;

  const isDark = mounted && theme === "dark";
  const textColor = isDark ? "#ffffff" : "#000000";
  const gridColor = isDark ? "#ffffff33" : "#e5e7eb";

  // 9. Component for the Monthly Revenue Chart
  const MonthlyRevenueChart = () => (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm transition-colors">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Monthly Revenue Trend (Landlords Only)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={revenueData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            tick={{ fill: textColor }}
            style={{ fill: textColor }}
          />
          <YAxis
            tick={{ fill: textColor }}
            style={{ fill: textColor }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
              borderRadius: "8px",
              color: textColor,
            }}
            labelStyle={{ color: textColor }}
            itemStyle={{ color: textColor }}
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
  );


  return (
    <div className="p-6 space-y-10 relative">
      {/* Hero section */}
      <div className="text-center space-y-3 relative min-h-[180px] flex flex-col justify-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 min-h-[48px] flex items-center justify-center">
          🏡 Find Your Perfect Room!
        </h1>
        <p className="text-gray-700 dark:text-gray-300 min-h-[24px]">
          Search, explore, and book rooms in your city. Fast, easy, and fun!
        </p>
      </div>
      
      {/* 10. Conditional Chart Rendering */}
      {role === "landlord" && !shouldShowLoader && revenueData.length > 0 && (
        <MonthlyRevenueChart />
      )}

      {/* Loading overlay */}
      {shouldShowLoader && <Loader message="Fetching rooms... ⏳" />}

      {/* Recommended carousels */}
      {!shouldShowLoader && (
        <div className="space-y-12">
          <RoomCarousel
            title="🔥 Most booked"
            rooms={topBooked}
            showRooms={showRooms}
            isFirstCarousel={true}
          />
          <RoomCarousel
            title="⭐ Highest rated"
            rooms={topRated}
            showRooms={showRooms}
            isFirstCarousel={false}
          />
          <RoomCarousel
            title="📅 Hot this month"
            rooms={hotThisMonth}
            showRooms={showRooms}
            isFirstCarousel={false}
          />
        </div>
      )}
    </div>
  );
}