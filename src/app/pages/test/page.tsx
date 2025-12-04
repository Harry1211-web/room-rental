"use client";

import { useState, useEffect } from "react";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export default function Banana() {
  const [keysPressed, setKeysPressed] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [glitch, setGlitch] = useState(false);

  //Listen for key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed((prev) => {
        const updated = [...prev, e.key].slice(-KONAMI_CODE.length);
        if (updated.join(",") === KONAMI_CODE.join(",")) {
          setShowModal(true);
          //trigger glitch effect
          setGlitch(true);
          setTimeout(() => setGlitch(false), 1200);
        }
        return updated;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  //Faster decay for debug overlay
  useEffect(() => {
    if (keysPressed.length === 0) return;
    const timer = setTimeout(() => {
      setKeysPressed((prev) => prev.slice(1));
    }, 800);
    return () => clearTimeout(timer);
  }, [keysPressed]);

  const deleteLeftoverFolders = async () => {
    if (!confirm("Are you sure you want to delete all leftover buckets?")) return;
    try {
      const res = await fetch("/api/admin/delete-leftovers", { method: "POST" });
      const data = await res.json();
      if (data.success) alert("Leftover buckets deleted!");
      else alert("Error: " + data.error);
    } catch (err) {
      alert("Something went wrong: " + err);
    }
  };

  if (!showModal) {
    return (
      <div className="fixed bottom-2 right-2 text-xs text-green-400 font-mono dark:text-green-300 bg-black bg-opacity-70 dark:bg-gray-900 px-2 py-1 rounded pointer-events-none z-50">
        {keysPressed.join(" → ")}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 dark:bg-gray-900 flex items-center justify-center z-50">
      <div
        className={`bg-gray-900 dark:bg-black text-green-400 dark:text-green-300 rounded-lg p-6 w-96 shadow-lg font-mono border border-green-700 relative overflow-hidden ${
          glitch ? "animate-glitch" : ""
        }`}
      >
        <h2 className="text-xl font-bold mb-4">Admin Console</h2>
        <p className="mb-4 text-sm text-green-300 dark:text-green-400">
          Hidden utilities for admins only.
        </p>
        <button
          className="w-full bg-red-700 text-white py-2 rounded mb-2 hover:bg-red-800"
          onClick={deleteLeftoverFolders}
        >
          Delete Leftover Buckets
        </button>
        <button
          className="w-full bg-gray-700 dark:bg-gray-800 py-2 rounded hover:bg-gray-600 dark:hover:bg-gray-700"
          onClick={() => setShowModal(false)}
        >
          Close
        </button>
      </div>
      <style jsx>{`
        @keyframes glitch {
          0% { transform: translate(0px, 0px); opacity: 1; }
          20% { transform: translate(-2px, 2px); opacity: 0.8; }
          40% { transform: translate(2px, -1px); opacity: 1; }
          60% { transform: translate(-1px, 1px); opacity: 0.9; }
          80% { transform: translate(1px, 0px); opacity: 1; }
          100% { transform: translate(0px, 0px); opacity: 1; }
        }
        .animate-glitch {
          animation: glitch 0.12s infinite;
        }
      `}</style>
    </div>
  );
}
