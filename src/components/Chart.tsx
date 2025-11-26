"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ChartProps {
  data: { month: string; users: number; rooms: number; bookings: number }[];
}

export function Chart({ data }: ChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  const textColor = isDark ? "#ffffff" : "#000000";
  const gridColor = isDark ? "#ffffff33" : "#e5e7eb";

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm transition-colors">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Statistics by month</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: textColor }}
            style={{ fill: textColor }}
          />
          <YAxis 
            tick={{ fill: textColor }}
            style={{ fill: textColor }}
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
          />
          <Legend 
            wrapperStyle={{ color: textColor }}
          />
          <Line type="monotone" dataKey="users" stroke="#3b82f6" name="Users" />
          <Line type="monotone" dataKey="rooms" stroke="#10b981" name="Rooms" />
          <Line type="monotone" dataKey="bookings" stroke="#f59e0b" name="Bookings" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
