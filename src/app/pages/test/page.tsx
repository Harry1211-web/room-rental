"use client";

import { useState, useEffect } from "react";

const KONAMI_CODE = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"
];

const hackerMessages = [
  "ACCESS GRANTED",
  "DELETING FILES...",
  "🍌 BANANAS SECURED 🍌",
  "ADMIN MODE ACTIVATED",
  "ERROR 0xBEEF"
];

export default function Banana() {
  const [keysPressed, setKeysPressed] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [hackerText, setHackerText] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Listen for key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed((prev) => {
        const updated = [...prev, e.key].slice(-KONAMI_CODE.length);
        if (updated.join(",") === KONAMI_CODE.join(",")) {
          setShowModal(true);
          setGlitch(true);
          setTimeout(() => setGlitch(false), 600);
        }
        return updated;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Hacker text effect
  useEffect(() => {
    if (!showModal) return;
    const interval = setInterval(() => {
      const msg = hackerMessages[Math.floor(Math.random() * hackerMessages.length)];
      setHackerText(msg.split("").sort(() => Math.random() - 0.5).join(""));
    }, 300);
    return () => clearInterval(interval);
  }, [showModal]);

  // Keys tracker decay
  useEffect(() => {
    if (keysPressed.length === 0) return;
    const timer = setTimeout(() => setKeysPressed((prev) => prev.slice(1)), 1000);
    return () => clearTimeout(timer);
  }, [keysPressed]);

  // Confetti 🍌 burst
  const confettiBurst = () => {
    for(let i=0; i<20; i++){
      const emoji = document.createElement("div");
      emoji.textContent = "🍌";
      emoji.style.position = "fixed";
      emoji.style.left = `${Math.random()*100}vw`;
      emoji.style.top = `0`;
      emoji.style.fontSize = `${12+Math.random()*24}px`;
      emoji.style.transition = "top 1s linear, opacity 1s linear";
      emoji.style.opacity = "1";
      document.body.appendChild(emoji);
      setTimeout(() => { 
        emoji.style.top = "100vh"; 
        emoji.style.opacity = "0";
      }, 50);
      setTimeout(() => { emoji.remove(); }, 1050);
    }
  }

  const fakeLoading = async () => {
    setLoading(true);
    setProgress(0);
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            resolve();
            return 100;
          }
          return prev + Math.floor(Math.random() * 10) + 5; // random increments
        });
      }, 200);
    });
  };

  const deleteLeftoverFolders = async () => {
    if (!confirm("Are you sure you want to delete leftover buckets?")) return;

    await fakeLoading(); // show fake progress bar
    confettiBurst(); // fun banana confetti

    try {
      const res = await fetch("/api/admin/delete-leftovers", { method: "POST" });
      const data = await res.json();
      alert(data.success ? "Leftover buckets deleted!" : "Error: " + data.error);
    } catch (err) {
      alert("Something went wrong: " + err);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  if (!showModal) {
    return (
      <div className="fixed bottom-2 right-2 text-xs font-mono text-gray-400 bg-black bg-opacity-20 px-1 py-0.5 rounded pointer-events-none select-none z-50">
        {keysPressed.join(" → ")}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className={`bg-gray-900 dark:bg-gray-800 text-cyan-400 rounded-lg p-6 w-80 shadow-lg border border-cyan-600 relative transition-transform ${
          glitch ? "animate-pulse" : ""
        }`}
      >
        <h2 className="text-lg font-semibold mb-2">Admin Console</h2>
        <p className="mb-2 text-sm text-cyan-300 italic">{hackerText}</p>
        <p className="mb-4 text-sm text-cyan-300">
          Hidden utilities for admins. Use carefully.
        </p>

        <button
          className="w-full bg-red-600 text-white py-2 rounded mb-2 hover:bg-red-700 transition-colors disabled:opacity-50"
          onClick={deleteLeftoverFolders}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete Leftover Buckets"}
        </button>

        {loading && (
          <div className="w-full bg-gray-700 rounded h-2 mt-2 overflow-hidden">
            <div
              className="bg-yellow-400 h-full transition-all"
              style={{ width: `${progress}%` }}
            >
              🍌
            </div>
          </div>
        )}

        <button
          className="w-full bg-gray-700 dark:bg-gray-700 py-2 rounded hover:bg-gray-600 transition-colors mt-2"
          onClick={() => setShowModal(false)}
          disabled={loading}
        >
          Close
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .animate-pulse {
          animation: pulse 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
