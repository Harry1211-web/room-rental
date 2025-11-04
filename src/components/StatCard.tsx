"use client";

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-xl font-bold mt-1">{value}</h3>
        </div>
        {icon && <div className="text-gray-400 text-2xl">{icon}</div>}
      </div>
    </div>
  );
}
