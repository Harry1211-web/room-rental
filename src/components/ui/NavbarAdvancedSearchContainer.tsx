import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "./button";
import { parseDateLocal, formatDateLocal, getMinTimeForToday } from "../utils/dateUtils";
import { toast } from "sonner";
interface Tag {
  value: string;
  value_type: string;
  amount: number;
}

interface FiltersState {
  checkinDate: string;
  checkoutDate: string;
  checkinTime: string;
  checkoutTime: string;
  city: string;
  areaMin: string;
  areaMax: string;
  tags: string[];
  priceMin: string;
  priceMax: string;
}

const validateDateTimeRange = (checkinDate: string, checkinTime: string, checkoutDate: string, checkoutTime: string) => {
  const ci = new Date(`${checkinDate}T${checkinTime || "00:00"}`);
  const co = new Date(`${checkoutDate}T${checkoutTime || "23:59"}`);
  return co > ci;
};

//Generate time options for select dropdown
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

export function NavbarAdvancedSearchContainer({ isAdvancedSearchPage }: { isAdvancedSearchPage: boolean }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dropdownFilterOpen, setDropdownFilterOpen] = useState(false);
  const [activeTagsDropdown, setActiveTagsDropdown] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState<"checkin" | "checkout" | null>(null);

  const [filters, setFilters] = useState<FiltersState>({
    checkinDate: "",
    checkoutDate: "",
    checkinTime: "12:00",
    checkoutTime: "12:00",
    city: "",
    areaMin: "",
    areaMax: "",
    tags: [],
    priceMin: "",
    priceMax: "",
  });
  
  const [cities, setCities] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const filtersRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const timeOptions = useMemo(() => generateTimeOptions(), []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownFilterOpen && filtersRef.current && !filtersRef.current.contains(target)) {
        setDropdownFilterOpen(false);
      }
      if (activeTagsDropdown && !(target as Element).closest(`[data-tags-group="${activeTagsDropdown}"]`)) {
        setActiveTagsDropdown(null);
      }
      if (calendarOpen && calendarRef.current && !calendarRef.current.contains(target)) {
        setCalendarOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownFilterOpen, activeTagsDropdown, calendarOpen]);

  useEffect(() => {
    if (!isAdvancedSearchPage) return;
    const fetchFilters = async () => {
      try {
        const { data: tagsData, error: tagsError } = await supabase.from("tags").select("value, value_type, amount");
        if (tagsError) throw new Error(tagsError.message);
        setTags(tagsData as Tag[]);

        const mockCities = ["Ho Chi Minh City", "Hanoi", "Da Nang"];
        setCities(mockCities);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, [isAdvancedSearchPage]);

  const groupedTags = useMemo(() => {
    return tags.reduce((acc, tag) => {
      const category = tag.value_type || "General";
      if (!acc[category]) acc[category] = [];
      acc[category].push(tag);
      return acc;
    }, {} as Record<string, Tag[]>);
  }, [tags]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleTagToggle = useCallback((tagValue: string, category: string) => {
    setFilters(prev => {
      const newTags = prev.tags.includes(tagValue)
        ? prev.tags.filter(t => t !== tagValue)
        : [...prev.tags, tagValue];
      return { ...prev, tags: newTags };
    });
    //Keep the dropdown open after selection
    setActiveTagsDropdown(category);
  }, []);

  const handleFind = () => {
    const { checkinDate, checkoutDate, checkinTime, checkoutTime, priceMin, priceMax, areaMin, areaMax } = filters;

    //Validate date ranges and price ranges as before
    if (checkinDate && checkoutDate && !validateDateTimeRange(checkinDate, checkinTime, checkoutDate, checkoutTime)) {
      toast.error("Checkout must be after check-in!");
      return;
    }

    if (priceMin && priceMax && parseInt(priceMin) > parseInt(priceMax)) {
      toast.error("Minimum price cannot be greater than maximum price!");
      return;
    }

    if (areaMin && areaMax && parseInt(areaMin) > parseInt(areaMax)) {
      toast.error("Minimum area cannot be greater than maximum area!");
      return;
    }

    const query = new URLSearchParams();

    //Add filters to the query string
    Object.entries(filters).forEach(([key, value]) => {
      if (key === "tags" && value) {
        (value as string[]).forEach(tag => query.append("tags", tag));
      } else if (value) {
        query.set(key, value as string);
      }
    });

    //Add search term to the query string
    if (searchTerm.trim()) {
      query.set("search", searchTerm.trim());
    }

    //Navigate to the search results page with the query string
    router.push(`/pages/advanced_search?${query.toString()}`);
    setDropdownFilterOpen(false);
  };

  //Add keyboard support for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFind();
    }
  };

  const selectedTagsData = useMemo(() => {
    return filters.tags.map(tagValue => tags.find(t => t.value === tagValue)).filter((t): t is Tag => t !== undefined);
  }, [filters.tags, tags]);

  //Generate unique key for tags
  const getTagKey = (tag: Tag) => {
    const amount = tag.amount !== null ? tag.amount : 0;
    //console.log(`Generated unique key: ${tag.value}_${amount}`);
    return `${tag.value}_${amount}`;
  };

  if (!isAdvancedSearchPage) return null;
  
  return (
    <div className="flex-1 mx-6 relative max-w-2xl" ref={filtersRef}>
      <input
        type="text"
        placeholder="Apply Advanced Filters..."
        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 cursor-pointer"
        onFocus={() => setDropdownFilterOpen(true)}
        onClick={() => setDropdownFilterOpen(prev => !prev)}
        readOnly
      />

      {dropdownFilterOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-6xl max-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-6 space-y-4 z-50">
          {/* Search Input */}
          <div className="flex flex-col mb-4">
            <label className="font-semibold mb-2">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by room name, description, or location..."
              className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Enter or click "Apply Filters" to search
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Check-in Date & Time */}
            <div className="flex flex-col flex-1 relative">
              <label className="font-semibold mb-2">Check-in:</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={filters.checkinDate ? formatDateLocal(new Date(filters.checkinDate)) : "DD/MM/YYYY"}
                    onClick={() => setCalendarOpen("checkin")}
                    readOnly
                    className="w-full border dark:border-gray-700 px-2 py-1 rounded-md dark:bg-gray-700 cursor-pointer"
                  />
                  {/* Popup Calendar for Check-in */}
                  {calendarOpen === "checkin" && (
                    <div ref={calendarRef} className="absolute top-full mt-1 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg">
                      <Calendar
                        mode="single"
                        selected={filters.checkinDate ? new Date(filters.checkinDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFilters(prev => ({
                              ...prev,
                              checkinDate: formatDateLocal(date),
                            }));
                            setCalendarOpen(null);
                          }
                        }}
                        className="rounded-md border"
                      />
                    </div>
                  )}
                </div>
                <select
                  name="checkinTime"
                  value={filters.checkinTime}
                  onChange={handleChange}
                  className="border dark:border-gray-700 px-2 py-1 rounded-md dark:bg-gray-700"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkout Date & Time */}
            <div className="flex flex-col flex-1 relative">
              <label className="font-semibold mb-2">Checkout:</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={filters.checkoutDate ? formatDateLocal(new Date(filters.checkoutDate)) : "DD/MM/YYYY"}
                    onClick={() => setCalendarOpen("checkout")}
                    readOnly
                    className="w-full border dark:border-gray-700 px-2 py-1 rounded-md dark:bg-gray-700 cursor-pointer"
                  />
                  {/* Popup Calendar for Checkout */}
                  {calendarOpen === "checkout" && (
                    <div ref={calendarRef} className="absolute top-full mt-1 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg">
                      <Calendar
                        mode="single"
                        selected={filters.checkoutDate ? new Date(filters.checkoutDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFilters(prev => ({
                              ...prev,
                              checkoutDate: formatDateLocal(date),
                            }));
                            setCalendarOpen(null);
                          }
                        }}
                        className="rounded-md border"
                      />
                    </div>
                  )}
                </div>
                <select
                  name="checkoutTime"
                  value={filters.checkoutTime}
                  onChange={handleChange}
                  className="border dark:border-gray-700 px-2 py-1 rounded-md dark:bg-gray-700"
                  disabled={!filters.checkinDate}
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags Selection - Side by Side Groups */}
          <div className="mt-4">
            <label className="font-semibold mb-3 block">Tags:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(groupedTags).map(category => (
                <div key={category} className="space-y-2" data-tags-group={category}>
                  <label className="font-medium text-sm">{category}</label>
                  <div className="relative">
                    <div
                      className="w-full border dark:border-gray-700 rounded px-2 py-2 text-sm dark:bg-gray-700 min-h-[40px] cursor-pointer flex flex-wrap gap-1"
                      onClick={() => setActiveTagsDropdown(activeTagsDropdown === category ? null : category)}
                    >
                      {filters.tags
                        .filter(tagValue => groupedTags[category].some(tag => tag.value === tagValue))
                        .map(tagValue => {
                          const tag = groupedTags[category].find(t => t.value === tagValue);
                          return (
                            <span
                              key={getTagKey(tag!)}
                              className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-2 py-1 rounded text-xs flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTagToggle(tagValue, category);
                              }}
                            >
                              {tag?.value}
                              <span className="ml-1 cursor-pointer">×</span>
                            </span>
                          );
                        })}
                      {filters.tags.filter(tagValue => groupedTags[category].some(tag => tag.value === tagValue)).length === 0 && (
                        <span className="text-gray-500">Select {category}</span>
                      )}
                    </div>
                    
                    {activeTagsDropdown === category && (
                      <div className="absolute top-full mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-700 border dark:border-gray-700 shadow-lg rounded-lg z-50">
                        {groupedTags[category].map(tag => (
                          <div
                            key={getTagKey(tag)}
                            className={`cursor-pointer px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-600 flex justify-between items-center ${
                              filters.tags.includes(tag.value) ? "bg-blue-50 dark:bg-blue-900" : ""
                            }`}
                            onClick={() => handleTagToggle(tag.value, category)}
                          >
                            <span>{tag.value}</span>
                            <span className="text-xs text-gray-500">({tag.amount})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Other Filters */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* City Dropdown */}
            <div className="flex flex-col flex-1">
              <label className="font-semibold mb-2">City:</label>
              <select
                name="city"
                value={filters.city}
                onChange={handleChange}
                className="w-full border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-700"
              >
                <option value="">All</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="flex flex-col flex-1">
              <label className="font-semibold mb-2">Price Range:</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="priceMin"
                  value={filters.priceMin}
                  onChange={handleChange}
                  placeholder="Min"
                  className="w-full border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-700"
                />
                <input
                  type="number"
                  name="priceMax"
                  value={filters.priceMax}
                  onChange={handleChange}
                  placeholder="Max"
                  className="w-full border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Area Range */}
            <div className="flex flex-col flex-1">
              <label className="font-semibold mb-2">Area Range (m²):</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="areaMin"
                  value={filters.areaMin}
                  onChange={handleChange}
                  placeholder="Min"
                  className="w-full border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-700"
                />
                <input
                  type="number"
                  name="areaMax"
                  value={filters.areaMax}
                  onChange={handleChange}
                  placeholder="Max"
                  className="w-full border dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="mt-6">
            <Button onClick={handleFind} className="w-full">Apply Filters</Button>
          </div>
        </div>
      )}
    </div>
  );
}