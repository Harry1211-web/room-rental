import { useState } from "react";

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

export function HoverCard({ children, content }: HoverCardProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute z-10 bg-white border shadow-lg p-3 rounded w-64 top-full mt-1">
          {content}
        </div>
      )}
    </div>
  );
}
