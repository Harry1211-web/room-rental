"use client";
import React, { useState } from "react";

export default function BangbooLoader() {
  const [imageUrl, setImageUrl] = useState("");
  const [frameHeight, setFrameHeight] = useState(125);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => setIsLoading(false), 5000);
  };

  // Calculate number of frames (4500 / frameHeight)
  const frameCount = Math.floor(4500 / frameHeight);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-slate-800">
          Bangboo Walking Animation Tester
        </h1>

        {/* Settings Panel */}
        <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Image URL (your 123x4500 webp)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/bangboo-walk.webp"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Frame Height: {frameHeight}px (Frames: {frameCount})
            </label>
            <input
              type="range"
              min="50"
              max="300"
              value={frameHeight}
              onChange={(e) => setFrameHeight(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Animation Speed: {animationSpeed}s
            </label>
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={startLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Test Loading Animation
          </button>
        </div>

        {/* Animation Preview */}
        <div className="bg-slate-100 rounded-lg p-8 flex flex-col items-center">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Preview</h2>

          {imageUrl ? (
            <div
              className="overflow-hidden bg-white rounded-lg shadow-lg"
              style={{
                width: "123px",
                height: `${frameHeight}px`,
              }}
            >
              <div
                style={{
                  width: "123px",
                  height: "4500px",
                  backgroundImage: `url(${imageUrl})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "123px 4500px",
                  animation: isLoading
                    ? `walk ${animationSpeed}s steps(${frameCount}) infinite`
                    : "none",
                }}
              />
            </div>
          ) : (
            <div className="text-slate-500 text-center py-12">
              Enter an image URL above to preview
            </div>
          )}

          {isLoading && (
            <p className="mt-4 text-slate-600 font-medium">Loading...</p>
          )}
        </div>

        {/* Code Example */}
        <div className="mt-8 bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
          <p className="text-xs text-slate-400 mb-2">
            CSS for your Next.js project:
          </p>
          <pre className="text-sm">
            {`.bangboo-loader {
  width: 123px;
  height: ${frameHeight}px;
  background: url('/bangboo-walk.webp') no-repeat;
  background-size: 123px 4500px;
  animation: walk ${animationSpeed}s steps(${frameCount}) infinite;
}

@keyframes walk {
  to { background-position: 0 -4500px; }
}`}
          </pre>
        </div>
      </div>

      <style jsx>{`
        @keyframes walk {
          to {
            background-position: 0 -4500px;
          }
        }
      `}</style>
    </div>
  );
}
