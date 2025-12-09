"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image"; // Import Image component
import { Button } from "./button";

interface RoomSearchResult {
  id: string;
  title: string;
  tags?: string[];
  description?: string;
  img_url?: string;
}

export function NavbarBasicSearch() {
  const router = useRouter();
  const pathname = usePathname();
  
  const isHomePage = pathname === '/';
  const DEFAULT_FALLBACK_URL = "/room-img-default.jpg";

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<RoomSearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    const searchKeyword = query.trim();

    if (searchKeyword.length < 1) {
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc(
        "rpc_search_rooms_by_keyword", 
        { keyword: searchKeyword.toLowerCase() }
      );

      if (error) throw error;
      
      setSuggestions((data as RoomSearchResult[]) || []);

    } catch (err) {
      console.error("Error fetching search suggestions:", JSON.stringify(err, null, 2));
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isHomePage) return;

    const handler = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); 
    
    return () => clearTimeout(handler);
  }, [searchQuery, handleSearch, isHomePage]);

  const handleSuggestionClick = (roomId: string) => {
    router.push(`/pages/room/${roomId}`);
    setSearchQuery("");
    setSuggestions([]);
  };

  const handleAdvancedClick = () => {
    router.push("/pages/advanced_search");
  };

  return (
    <div className="flex-1 mx-6 relative max-w-2xl" ref={containerRef}>
      <div className="flex w-full space-x-2">
        <input
          type="text"
          placeholder="Search by title, tags, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="flex-1 px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition"
        />
        
        <Button 
          onClick={handleAdvancedClick} 
          className="px-4 py-2 bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-700 text-white rounded-lg transition text-sm font-semibold"
        >
          Advanced
        </Button>
      </div>

      {/* Suggestion Dropdown */}
      {isHomePage && isFocused && searchQuery && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 mt-2 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading suggestions...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((room) => (
              <div
                key={room.id}
                className="p-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-b-0"
                onMouseDown={(e) => { 
                  e.preventDefault(); 
                  handleSuggestionClick(room.id);
                }}
              >
                {/* Image Thumbnail */}
                <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <Image
                    src={room.img_url || DEFAULT_FALLBACK_URL}
                    alt={`Image of ${room.title}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                    onError={(e) => {
                      // Simple error handling to show fallback image
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_FALLBACK_URL;
                    }}
                  />
                </div>
                
                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5 truncate">
                    {room.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {room.tags && room.tags.length > 0 && (
                      <span className="mr-2 text-blue-500">[{room.tags.join(', ')}]</span>
                    )}
                    {room.description}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No matching rooms found.</div>
          )}
        </div>
      )}
    </div>
  );
}
