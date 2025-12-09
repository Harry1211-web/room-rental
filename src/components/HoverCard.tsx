import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom"; // 👈 New import

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

export function HoverCard({ children, content }: HoverCardProps) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  // Calculate the position of the trigger element
  const calculatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position the top-left corner of the hover card right below the trigger
      setCoords({
        x: rect.left + window.scrollX, 
        y: rect.top + window.scrollY + rect.height,
      });
    }
  };

  useEffect(() => {
    if (visible) {
      calculatePosition();
      // Recalculate position on scroll/resize in case the element moves
      window.addEventListener("scroll", calculatePosition);
      window.addEventListener("resize", calculatePosition);
    }

    return () => {
      window.removeEventListener("scroll", calculatePosition);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [visible]);

  // The DOM node we want to use as the portal target (the document body)
  const portalRoot = typeof document !== 'undefined' ? document.body : null;

  return (
    <div
      ref={triggerRef} // Attach ref to trigger div
      className="relative inline-block text-left"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      
      {/* 2. Use a Portal to render the content outside the component's DOM tree */}
      {visible && portalRoot && createPortal(
        <div 
          style={{ 
            top: coords.y + 8, // +8 pixels for a small gap
            left: coords.x,
          }}
          className="fixed z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl p-3 rounded w-64 text-gray-900 dark:text-gray-100 transition-opacity"
        >
          {content}
        </div>,
        portalRoot // Render into document.body
      )}
    </div>
  );
}