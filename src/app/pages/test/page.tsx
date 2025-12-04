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

  //Listen for key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed((prev) => {
        const updated = [...prev, e.key].slice(-KONAMI_CODE.length); //keep last n keys
        if (updated.join(",") === KONAMI_CODE.join(",")) {
          setShowModal(true);
        }
        return updated;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      //Tiny debug overlay in bottom-right corner
      <div className="fixed bottom-1 right-1 text-xs text-gray-500 opacity-30 pointer-events-none z-50">
        {keysPressed.join(" → ")}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Admin Utilities</h2>
        <p className="mb-4 text-sm text-gray-600">Hidden utilities for admins only.</p>
        <button
          className="w-full bg-red-500 text-white py-2 rounded mb-2 hover:bg-red-600"
          onClick={deleteLeftoverFolders}
        >
          Delete Leftover Buckets
        </button>
        <button
          className="w-full bg-gray-300 py-2 rounded hover:bg-gray-400"
          onClick={() => setShowModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
}
