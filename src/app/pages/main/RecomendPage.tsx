"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import RoomCard from "@/components/RoomCard";
import { useUser } from "@/app/context/Usercontext";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

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
  const [search, setSearch] = useState("");
  const [showSyntaxHelp, setShowSyntaxHelp] = useState(false);
  const [suggestions, setSuggestions] = useState<{ category: string; items: { syntax: string; description: string }[] }[]>([]);
  const [searchResults, setSearchResults] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRooms, setShowRooms] = useState(false);
  const { setLoading } = useUser();
  const router = useRouter();

  const carouselRefs = {
    booked: useRef<HTMLDivElement>(null),
    rated: useRef<HTMLDivElement>(null),
    hot: useRef<HTMLDivElement>(null),
  };
  const searchInputRef = useRef<HTMLInputElement>(null);

  //Fetch recommended rooms on mount
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

  //Fetch autocomplete suggestions
  useEffect(() => {
    if (!search) {
      setSuggestions([]);
      return;
    }
  
    const timer = setTimeout(async () => {
      try {
        const suggestions: { category: string; items: { syntax: string; description: string }[] }[] = [];
        const lastWord = search.split(/\s+/).pop()?.toLowerCase() || "";
  
        //Check if user is typing a filter
        if (lastWord.includes(":")) {
          const parts = lastWord.split(":");
          const prefix = parts[0];
          const partial = parts.slice(1).join(":"); //Handle multiple colons
  
          //For features with amounts (bedroom, bathroom, kitchen, etc.)
          if (prefix === "feature" && partial.includes(" ")) {
            //Second stage: show amounts for the selected feature
            const [featureName] = partial.split(" ");
            const { data: tags } = await supabase
              .from("tags")
              .select("value, amount")
              .eq("value_type", "feature")
              .eq("value", featureName)
              .not("amount", "is", null)
              .limit(10);
  
            if (tags && tags.length > 0) {
              suggestions.push({
                category: `FEATURE: ${featureName.toUpperCase()}`,
                items: tags.map(t => ({
                  syntax: `feature:${t.value} ${t.amount}`,
                  description: `${t.amount} ${t.value}${t.amount !== "1" ? "s" : ""}`
                }))
              });
            }
          } else if (["type", "feature", "amenity", "policy", "location"].includes(prefix)) {
            //First stage: show feature types (without amounts)
            const { data: tags } = await supabase
              .from("tags")
              .select("value_type, value, amount")
              .eq("value_type", prefix)
              .ilike("value", `%${partial}%`)
              .limit(10);
  
            if (tags && tags.length > 0) {
              //For features, group by value and only show unique values
              const uniqueValues = new Map<string, any>();
              tags.forEach(t => {
                if (prefix === "feature" && t.amount) {
                  //Only show the base feature name once
                  if (!uniqueValues.has(t.value)) {
                    uniqueValues.set(t.value, { ...t, showAmount: true });
                  }
                } else {
                  uniqueValues.set(t.value, t);
                }
              });
  
              suggestions.push({
                category: prefix.toUpperCase(),
                items: Array.from(uniqueValues.values()).map(t => ({
                  syntax: `${prefix}:${t.value}${t.showAmount ? " " : ""}`,
                  description: t.showAmount ? `${t.value} (specify amount)` : t.value
                }))
              });
            }
          }
  
          //Rating syntax
          if (prefix === "rating") {
            const ratingOptions = [
              { syntax: "rating:>4", description: "Above 4 stars" },
              { syntax: "rating:>3", description: "Above 3 stars" },
              { syntax: "rating:5", description: "Exactly 5 stars" },
              { syntax: "rating:<4", description: "Below 4 stars" }
            ].filter(r => !partial || r.syntax.toLowerCase().includes(partial.toLowerCase()));
  
            if (ratingOptions.length > 0) {
              suggestions.push({
                category: "RATING",
                items: ratingOptions
              });
            }
          }
  
          //City syntax with real-time filtering
          if (prefix === "city") {
            const { data: rooms } = await supabase
              .from("rooms")
              .select("city")
              .ilike("city", `%${partial}%`)
              .limit(10);
            
            const uniqueCities = [...new Set(rooms?.map(c => c.city) || [])];
            if (uniqueCities.length > 0) {
              suggestions.push({
                category: "CITY",
                items: uniqueCities.map(city => ({
                  syntax: `city:"${city}"`,
                  description: city
                }))
              });
            }
          }
        }
  
        setSuggestions(suggestions);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 300);
  
    return () => clearTimeout(timer);
  }, [search]);

  //Manual search
  const handleSearch = async () => {
    if (!search) return;
  
    try {
      let query = supabase.from("rooms").select("*");
      
      //Parse filters with quoted values support
      const filterRegex = /(\w+):(".*?"|[^\s]+)/g;
      const filters: { key: string; value: string }[] = [];
      let match;
      
      while ((match = filterRegex.exec(search)) !== null) {
        filters.push({
          key: match[1],
          value: match[2].replace(/"/g, "") //Remove quotes
        });
      }
  
      //Remove filters from search to get free text
      const freeText = search.replace(filterRegex, "").trim();
  
      //Apply filters
      for (const filter of filters) {
        if (filter.key === "city") {
          query = query.ilike("city", `%${filter.value}%`);
        } else if (filter.key === "rating") {
          if (filter.value.startsWith(">")) {
            query = query.gte("average_rating", filter.value.slice(1));
          } else if (filter.value.startsWith("<")) {
            query = query.lte("average_rating", filter.value.slice(1));
          } else {
            query = query.eq("average_rating", filter.value);
          }
        }
        //Add tag filters here if you have room_tags junction table
      }
  
      //Free text search
      if (freeText) {
        query = query.or(`title.ilike.%${freeText}%,description.ilike.%${freeText}%`);
      }
  
      const { data } = await query;
      setSearchResults(data ?? []);
      setSuggestions([]);
      setShowSyntaxHelp(false);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  //Carousel scroll helper
  const scrollCarousel = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (!ref.current) return;
    const scrollAmount = ref.current.offsetWidth * 0.8;
    ref.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  const renderCarousel = (rooms: Room[], ref: React.RefObject<HTMLDivElement>) => {
    if (!rooms || rooms.length === 0)
      return <p className="text-gray-500 dark:text-gray-300">No rooms found 😢</p>;

    return (
      <div className="relative group">
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
          {rooms.map((room, i) => (
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
      <div className="text-center space-y-3 relative">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          🏡 Find Your Perfect Room!
        </h1>
        <p className="text-gray-700 dark:text-gray-300">
          Search, explore, and book rooms in your city. Fast, easy, and fun!
        </p>

        {/* Search bar */}
        <div className="mt-4 flex justify-center relative w-full max-w-lg mx-auto">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="🔍 Search... (try: type:apartment feature:bathroom)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSyntaxHelp(true);
            }}
            onFocus={() => setShowSyntaxHelp(true)}
            onBlur={() => setTimeout(() => setShowSyntaxHelp(false), 200)}
            className="w-full px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-r-lg transition"
          >
            Show
          </button>
          <button
            onClick={() => router.push("/pages/advanced-search")} // need pages for this shit 
            className="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
          >
            Advanced Search
          </button>
          
          {
          /*
            cần chỉnh room card để hiện tag lên, với room/[id] đồ cũng phải có tag luôn
            chứ duma filter xong ko bt nó có tag ko ỉa vcl
            also we need better UI design fr fr ASAP no cap man 
          */
          }
          {/* Suggestions */}
          {(showSyntaxHelp || suggestions.length > 0) && (
            <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 mt-1 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {suggestions.length === 0 && showSyntaxHelp && (
                <div className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Search Options:</p>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">type:</span> apartment, studio, condo, dorm</div>
                    <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">feature:</span> bedroom, bathroom, kitchen, size</div>
                    <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">amenity:</span> wifi, ac, parking, pool, gym</div>
                    <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">policy:</span> pet_friendly, smoking_allowed</div>
                    <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">location:</span> downtown, near_station, city_center</div>
                    <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">rating:</span> &gt;4, &lt;5, 5</div>
                    <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">city:</span> Ho Chi Minh City</div>
                  </div>
                </div>
              )}
              
              {suggestions.map((group, i) => (
                <div key={i} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {group.category}
                  </div>
                  {group.items.map((item, j) => (
                    <div
                      key={j}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const words = search.split(/\s+/);
                        const lastWord = words[words.length - 1];
                        
                        //Replace the last filter being typed
                        if (lastWord.includes(":")) {
                          words[words.length - 1] = item.syntax;
                        } else {
                          words.push(item.syntax);
                        }
                        
                        const newSearch = words.join(" ");
                        setSearch(newSearch);
                        
                        //Keep suggestions open if the syntax ends with a space (expects more input)
                        if (item.syntax.endsWith(" ")) {
                          setTimeout(() => {
                            searchInputRef.current?.focus();
                            //Trigger suggestions update
                            setSearch(newSearch);
                          }, 0);
                        } else {
                          //Add space for next filter
                          setTimeout(() => {
                            searchInputRef.current?.focus();
                            setSearch(newSearch + " ");
                          }, 0);
                        }
                      }}
                    >
                      <div className="font-mono text-sm text-blue-600 dark:text-blue-400">{item.syntax}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
          <div className="text-5xl animate-bounce mb-4">🏃‍♂️💨</div>
          <p className="text-xl text-gray-800 dark:text-gray-200 animate-pulse">
            Fetching rooms... ⏳
          </p>
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && (
        <section className={sectionClasses}>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            🔎 Search Results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((room) => (
              <RoomCard key={room.id} {...room} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended carousels */}
      {!isLoading && (
        <>
          <section className={sectionClasses}>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              🔥 Most booked
            </h2>
            {renderCarousel(topBooked, carouselRefs.booked)}
          </section>

          <section className={sectionClasses}>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              ⭐ Highest rated
            </h2>
            {renderCarousel(topRated, carouselRefs.rated)}
          </section>

          <section className={sectionClasses}>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              📅 Hot this month
            </h2>
            {renderCarousel(hotThisMonth, carouselRefs.hot)}
          </section>
        </>
      )}
    </div>
  );
}
