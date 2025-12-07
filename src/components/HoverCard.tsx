"use client";

import { useState, useRef, useEffect } from "react";
import * as ReactDOM from "react-dom";

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

interface Position {
  top: number;
  left: number;
  direction: 'up' | 'down';
}

// Estimated height of the popup content box + margin
const POPUP_HEIGHT = 210; 

export function HoverCard({ children, content }: HoverCardProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  // Calculate and set position when the card becomes visible
  useEffect(() => {
    if (!visible || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let top = 0;
    let direction: 'up' | 'down' = 'down';

    // Decide direction: Go down if there's enough space below, otherwise go up.
    if (spaceBelow >= POPUP_HEIGHT || spaceBelow >= spaceAbove) {
      // Position BELOW the trigger
      top = rect.bottom + window.scrollY + 5; // 5px margin
      direction = 'down';
    } else {
      // Position ABOVE the trigger
      top = rect.top + window.scrollY - POPUP_HEIGHT - 5; // 5px margin
      direction = 'up';
    }

    setPosition({ top, left: rect.left, direction });
  }, [visible]);

  // Content Rendered via Portal
  const PopupContent = position && (
    <div
      style={{
        top: position.top,
        left: position.left,
        position: 'absolute', 
      }}
      className={`absolute z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg p-3 rounded w-64 text-gray-900 dark:text-gray-100 transition-colors
        ${position.direction === 'up' ? 'transform -translate-y-full -mt-2' : 'mt-1'}` 
      }
    >
      {content}
    </div>
  );

  return (
    <div
      ref={triggerRef}
      className="relative inline-block text-left"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      
      {/* Portal Injection: Renders outside the main DOM flow (into document.body) */}
      {visible && position && typeof window !== 'undefined' && ReactDOM.createPortal(
        PopupContent,
        document.body
      )}
    </div>
  );
}