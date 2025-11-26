"use client";

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  titleColor?: string;
}

export function StatCard({ title, value, icon, bgColor, textColor, titleColor }: StatCardProps) {
  return (
    <div className={`p-4 rounded-xl shadow-sm hover:shadow-md transition-colors ${bgColor || "bg-white dark:bg-gray-800"} border dark:border-gray-700`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${titleColor || "text-gray-500 dark:text-gray-400"}`}>{title}</p>
          <h3 className={`text-2xl font-bold mt-1 ${textColor || "text-gray-900 dark:text-gray-100"}`}>{value}</h3>
        </div>
        {icon && <div className="text-gray-400 dark:text-gray-500 text-2xl">{icon}</div>}
      </div>
    </div>
  );
}
