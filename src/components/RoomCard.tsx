"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface RoomCardProps {
  id: string;
  title: string;
  city: string;
  price: number;
  area?: number;
  avg_rating?: number;
  totalbooking?: number;
  tags: string[];
  images?: string[];
  priority?: boolean;
}

export default function RoomCard({
  id,
  title,
  city,
  price,
  area,
  avg_rating,
  totalbooking,
  tags,
  images,
  priority = false,
}: RoomCardProps) {
  const DEFAULT_FALLBACK_URL = "/room-img-default.png";

  const validImages =
    Array.isArray(images) && images.length > 0 ? images : [DEFAULT_FALLBACK_URL];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [loadedImages, setLoadedImages] = useState<boolean[]>(
    validImages.map(() => false)
  );
  const router = useRouter();

  // Reset image state when room ID or primary image changes
  useEffect(() => {
    setLoadedImages(validImages.map(() => false));
    setCurrentIndex(0);
  }, [id, validImages[0]]);

  // Carousel auto-switch logic
  useEffect(() => {
    if (hovering || validImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [hovering, validImages.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => {
      const copy = [...prev];
      copy[index] = true;
      return copy;
    });
  };

  return (
    <div
      key={id}
      className="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer bg-white dark:bg-gray-800 min-h-[320px] flex flex-col group"
      onClick={() => router.push(`/pages/room/${id}`)}
    >
      {/* Image area */}
      <div
        className="relative w-full h-44 overflow-hidden bg-gray-100 dark:bg-gray-700"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {validImages.map((src, index) => (
          <Image
            key={index}
            src={src || DEFAULT_FALLBACK_URL}
            alt={`${title} image ${index}`}
            fill
            priority={priority && index === 0}
            loading={priority ? "eager" : "lazy"}
            quality={75}
            className={`object-cover transition-opacity duration-300 ${
              index === currentIndex && loadedImages[index] ? "opacity-100" : "opacity-0"
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => handleImageLoad(index)}
            onError={() => handleImageLoad(index)}
          />
        ))}

        {/* Skeleton */}
        {!loadedImages[currentIndex] && (
          <div className="absolute inset-0 bg-gray-300 dark:bg-gray-600 animate-pulse flex items-center justify-center">
            <span className="text-gray-400">🏠</span>
          </div>
        )}

        {/* Navigation buttons */}
        {validImages.length > 1 && (
          <div
            className={`absolute inset-0 flex items-center justify-between transition-opacity duration-200 ${
              hovering ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              onClick={handlePrev}
              aria-label="Previous image"
              className="ml-1 bg-black bg-opacity-40 p-1.5 rounded-full text-white hover:bg-opacity-60 transition z-10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              &lt;
            </button>
            <button
              onClick={handleNext}
              aria-label="Next image"
              className="mr-1 bg-black bg-opacity-40 p-1.5 rounded-full text-white hover:bg-opacity-60 transition z-10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              &gt;
            </button>
          </div>
        )}

        {/* Indicators */}
        {validImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {validImages.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === currentIndex ? "bg-white" : "bg-gray-400 opacity-70"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1 min-h-[32px]">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate flex-1 mr-2 text-base">
            {title}
          </h3>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 flex-shrink-0">
              {tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full whitespace-nowrap font-medium"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-[11px] text-gray-500 dark:text-gray-300 whitespace-nowrap">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 min-h-[20px] flex items-center">
          📍 {city}
        </p>

        <p className="text-green-600 dark:text-green-400 font-bold mt-1 min-h-[24px] flex items-center text-lg">
          ${price.toLocaleString()} / night
        </p>

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300 mt-2 min-h-[20px] items-center pt-1 border-t dark:border-gray-700">
          {area && <span className="flex items-center gap-1">📏 {area} m²</span>}
          {avg_rating !== undefined && (
            <span className="flex items-center gap-1 font-semibold text-yellow-500">
              ⭐ {Number(avg_rating).toFixed(1)}
            </span>
          )}
          {totalbooking !== undefined && (
            <span className="flex items-center gap-1">🛏️ {totalbooking} Bookings</span>
          )}
        </div>
      </div>
    </div>
  );
}
