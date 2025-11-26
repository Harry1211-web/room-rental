import { useState } from "react";

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

export function HoverCard({ children, content }: HoverCardProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block text-left"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute z-10 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg p-3 rounded w-64 top-full mt-1 text-gray-900 dark:text-gray-100 transition-colors">
          {content}
        </div>
      )}
    </div>
  );
}
