import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import RoomCard from "@/components/RoomCard";
import { useUser } from "@/app/context/Usercontext";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

interface Room {
  id: string;
  title: string;
  city: string;
  price: number;
  area: number;
  avg_rating: number;
  totalbooking: number;
  images: string[];
  tags: string[];
}

export default function RecommendPage() {
  const [topBooked, setTopBooked] = useState<Room[]>([]);
  const [topRated, setTopRated] = useState<Room[]>([]);
  const [hotThisMonth, setHotThisMonth] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showRooms, setShowRooms] = useState(false);
  const { setLoading } = useUser();

  const carouselRefs = {
    booked: useRef<HTMLDivElement>(null),
    rated: useRef<HTMLDivElement>(null),
    hot: useRef<HTMLDivElement>(null),
  };

  // Fetch rooms on mount
  useEffect(() => {
    let mounted = true;

    const fetchRooms = async () => {
      try {
        const { data: booked } = await supabase.rpc<Room[]>("rpc_top_booked_rooms");
        const { data: rated } = await supabase.rpc<Room[]>("rpc_top_rated_rooms");
        const { data: hot } = await supabase.rpc<Room[]>("rpc_hot_rooms_this_month");

        if (mounted) {
          setTopBooked(booked ?? []);
          setTopRated(rated ?? []);
          setHotThisMonth(hot ?? []);
          setIsLoading(false);
          setLoading(false);
          
          // Trigger fade-in animation
          setTimeout(() => {
            if (mounted) setShowRooms(true);
          }, 100);
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
        if (mounted) {
          setIsLoading(false);
          setLoading(false);
        }
      }
    };

    fetchRooms();

    return () => {
      mounted = false;
    };
  }, [setLoading]);

  // Carousel scroll helper
  const scrollCarousel = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (!ref.current) return;
    const scrollAmount = ref.current.offsetWidth * 0.8;
    ref.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  // Render carousel
  const renderCarousel = (rooms: Room[], ref: React.RefObject<HTMLDivElement>) => {
    const filteredRooms = rooms.filter(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.city.toLowerCase().includes(search.toLowerCase())
    );

    if (filteredRooms.length === 0) return <p className="text-gray-500 dark:text-gray-300">No rooms found 😢</p>;

    return (
      <div className="relative group">
        {/* Scroll buttons */}
        <button
          onClick={() => scrollCarousel(ref, "left")}
          className="hidden group-hover:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 dark:bg-white/20 text-white dark:text-black p-2 rounded-full hover:bg-black/70 dark:hover:bg-white/40 transition"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollCarousel(ref, "right")}
          className="hidden group-hover:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 dark:bg-white/20 text-white dark:text-black p-2 rounded-full hover:bg-black/70 dark:hover:bg-white/40 transition"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>

        <div
          ref={ref}
          className="flex overflow-x-auto space-x-4 pb-3 snap-x snap-mandatory scrollbar-hide"
        >
          {filteredRooms.map((room, i) => (
            <div
              key={room.id}
              className={`snap-start shrink-0 w-72 transition-opacity duration-700 ${
                showRooms ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <RoomCard {...room} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const sectionClasses = "space-y-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md";

  return (
    <div className="p-6 space-y-10 relative">
      {/* Hero + search */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">🏡 Find Your Perfect Room!</h1>
        <p className="text-gray-700 dark:text-gray-300">
          Search, explore, and book rooms in your city. Fast, easy, and fun!
        </p>
        <div className="mt-4 flex justify-center">
          <input
            type="text"
            placeholder="🔍 Search by title or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-lg px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
          <div className="text-5xl animate-bounce mb-4">🏃‍♂️💨</div>
          <p className="text-xl text-gray-800 dark:text-gray-200 animate-pulse">Fetching rooms... ⏳</p>
        </div>
      )}

      {/* Carousels */}
      {!isLoading && (
        <>
          <section className={sectionClasses}>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">🔥 Most booked</h2>
            {renderCarousel(topBooked, carouselRefs.booked)}
          </section>

          <section className={sectionClasses}>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">⭐ Highest rated</h2>
            {renderCarousel(topRated, carouselRefs.rated)}
          </section>

          <section className={sectionClasses}>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">📅 Hot this month</h2>
            {renderCarousel(hotThisMonth, carouselRefs.hot)}
          </section>
        </>
      )}
    </div>
  );
}