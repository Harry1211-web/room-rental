import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/app/context/Usercontext";
import { Loader } from "@/components/Loader";
import { RoomCarousel } from "@/components/RoomCarousel";

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

export default function RecommendPage() {
  const [topBooked, setTopBooked] = useState<Room[]>([]);
  const [topRated, setTopRated] = useState<Room[]>([]);
  const [hotThisMonth, setHotThisMonth] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRooms, setShowRooms] = useState(false);
  const { setLoading } = useUser();

  // Fetch recommended rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        const [booked, rated, hot] = await Promise.all([
          supabase.rpc<Room[]>("rpc_top_booked_rooms"),
          supabase.rpc<Room[]>("rpc_top_rated_rooms"),
          supabase.rpc<Room[]>("rpc_hot_rooms_this_month")
        ]);

        // Update states only once data is fetched
        setTopBooked(booked.data ?? []);
        setTopRated(rated.data ?? []);
        setHotThisMonth(hot.data ?? []);
        setShowRooms(true);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    fetchRooms();
  }, [setLoading]);

  // Show loader until both data and image are loaded
  const shouldShowLoader = isLoading;

  return (
    <div className="p-6 space-y-10 relative">
      {/* Hero section */}
      <div className="text-center space-y-3 relative min-h-[180px] flex flex-col justify-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 min-h-[48px] flex items-center justify-center">
          🏡 Find Your Perfect Room!
        </h1>
        <p className="text-gray-700 dark:text-gray-300 min-h-[24px]">
          Search, explore, and book rooms in your city. Fast, easy, and fun!
        </p>
      </div>

      {/* Loading overlay */}
      {shouldShowLoader && <Loader message="Fetching rooms... ⏳" />}

      {/* Recommended carousels */}
      {!shouldShowLoader && (
        <div className="space-y-12">
          <RoomCarousel
            title="🔥 Most booked"
            rooms={topBooked}
            showRooms={showRooms}
            isFirstCarousel={true}
          />
          <RoomCarousel
            title="⭐ Highest rated"
            rooms={topRated}
            showRooms={showRooms}
            isFirstCarousel={false}
          />
          <RoomCarousel
            title="📅 Hot this month"
            rooms={hotThisMonth}
            showRooms={showRooms}
            isFirstCarousel={false}
          />
        </div>
      )}
    </div>
  );
}
