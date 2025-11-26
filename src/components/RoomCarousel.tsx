"use client";

import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import RoomCard from "@/components/RoomCard"; 

interface Room {
  id: string;
  title: string;
  city: string;
  price: number;
  area?: string;
  avg_rating?: number;
  totalbooking?: number;
  images?: string[];
  tags?: string[];
}

interface RoomCarouselProps {
  title: string;
  rooms: Room[];
  showRooms?: boolean;
  emptyMessage?: string;
  isFirstCarousel?: boolean; 
}

export function RoomCarousel({ 
  title, 
  rooms, 
  showRooms = true,
  emptyMessage = "No rooms found 😢",
  isFirstCarousel = false 
}: RoomCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.offsetWidth * 0.8;
    carouselRef.current.scrollBy({ 
      left: direction === "left" ? -scrollAmount : scrollAmount, 
      behavior: "smooth" 
    });
  };

  return (
    <section className="space-y-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md min-h-[400px]"> {/* 🔥 Fixed height */}
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2 min-h-[32px] flex items-center"> {/* 🔥 Fixed height */}
        {title}
      </h2>
      
      {!rooms?.length ? (
        <p className="text-gray-500 dark:text-gray-300 min-h-[200px] flex items-center justify-center"> {/* 🔥 Fixed height */}
          {emptyMessage}
        </p>
      ) : (
        <div className="relative group min-h-[320px]"> {/* 🔥 Fixed height */}
          <button
            onClick={() => scrollCarousel("left")}
            className="hidden group-hover:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 dark:bg-white/20 text-white dark:text-black p-2 rounded-full hover:bg-black/70 dark:hover:bg-white/40 transition"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollCarousel("right")}
            className="hidden group-hover:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 dark:bg-white/20 text-white dark:text-black p-2 rounded-full hover:bg-black/70 dark:hover:bg-white/40 transition"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>

          <div ref={carouselRef} className="flex overflow-x-auto space-x-4 pb-3 snap-x snap-mandatory scrollbar-hide">
            {rooms.map((room, i) => (
              <div
                key={room.id}
                className={`snap-start shrink-0 w-72 transition-opacity duration-500 ${showRooms ? "opacity-100" : "opacity-0"}`} 
                style={{ transitionDelay: `${i * 50}ms` }} 
              >
                <RoomCard 
                  {...room}
                  area={room.area ? parseFloat(room.area) : undefined}
                  tags={room.tags || []}
                  priority={isFirstCarousel && i < 2}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}