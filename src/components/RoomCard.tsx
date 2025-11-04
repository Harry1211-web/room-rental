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
}: RoomCardProps) {
  const validImages =
    Array.isArray(images) && images.length > 0
      ? images
      : ["/room-img-default.jpg"];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const router = useRouter();

  // Automatically change the image every 3 seconds (if there are multiple images)
  useEffect(() => {
    if (hovering || validImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [hovering, validImages.length]);

  return (
    <div
      key={id}
      className="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer bg-white dark:bg-gray-800"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => router.push(`/pages/room/${id}`)}
    >
      {/* Image area */}
      <div className="relative w-full h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {validImages.map((src, index) => (
          <Image
            key={index}
            src={src}
            alt={`${title} image ${index}`}
            fill
            className={`object-contain absolute top-0 left-0 transition-opacity duration-700 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={index === 0} // prioritize the first image
          />
        ))}

        {validImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
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
      <div className="p-3">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{title}</h3>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-[11px] text-gray-500 dark:text-gray-300">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300">{city}</p>
        <p className="text-green-600 dark:text-green-400 font-semibold mt-1">
          {price.toLocaleString()}₫ / đêm
        </p>

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300 mt-2">
          {area && <span>{area} m²</span>}
          {avg_rating !== undefined && <span>⭐ {Number(avg_rating).toFixed(1)}</span>}
          {totalbooking !== undefined && <span>🛏️ {totalbooking} lượt</span>}
        </div>
      </div>
    </div>
  );
}
