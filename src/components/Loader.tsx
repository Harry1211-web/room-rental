"use client";

import { useEffect, useState } from "react";

interface LoaderProps {
  message?: string;
  frameHeight?: number;
  animationSpeed?: number;
  minDisplayTime?: number;
}

export function Loader({ 
  message = "Loading...", 
  minDisplayTime = 2000 
}: LoaderProps) {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime]);

  if (!showLoader) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-800/70 dark:bg-neutral-900/80 backdrop-blur-sm">
      <div 
        className="mb-4"
        style={{
          width: '123px',
          height: '150px',
          background: 'url(/loading.webp) no-repeat',
          backgroundSize: '123px 4500px',
          animation: `bangbooWalk 0.5s steps(30) infinite`
        }}
      />
      <p className="text-xl text-gray-800 dark:text-gray-200 animate-pulse">{message}</p>

      <style jsx>{`
        @keyframes bangbooWalk {
          to { background-position: 0 -4500px; }
        }
      `}</style>
    </div>
  );
}
