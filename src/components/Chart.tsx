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

interface ChartProps {
  data: { month: string; users: number; rooms: number; bookings: number }[];
}

export function Chart({ data }: ChartProps) {
  return (
    <div className="p-4 bg-white rounded-xl border shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Thống kê theo tháng</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="users" stroke="#3b82f6" name="Users" />
          <Line type="monotone" dataKey="rooms" stroke="#10b981" name="Rooms" />
          <Line type="monotone" dataKey="bookings" stroke="#f59e0b" name="Bookings" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
