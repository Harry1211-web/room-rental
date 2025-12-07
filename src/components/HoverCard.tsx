"use client";

import { useState, useRef, useEffect } from "react";
import * as ReactDOM from "react-dom";

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

export function HoverCard({ children, content }: HoverCardProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !triggerRef.current) return setPosition(null);

    const rect = triggerRef.current.getBoundingClientRect();
    const popupWidth = 260;

    //Clamp X so the popup never affects layout
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - popupWidth - 8)
    );

    const top = rect.bottom + window.scrollY + 8;

    setPosition({ top, left });
  }, [visible]);

  //Never render popup until position exists → no DOM pollution
  const popupRendered =
    visible &&
    position &&
    ReactDOM.createPortal(
      <div
        style={{
          position: "absolute",
          top: position.top,
          left: position.left,
          zIndex: 9999,
        }}
        className="w-64 p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow-lg"
      >
        {content}
      </div>,
      document.body
    );

  return (
    <div
      ref={triggerRef}
      className="contents"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {popupRendered}
    </div>
  );
}
