"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/app/context/Usercontext";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabaseClient";
import { Calendar } from "@/components/ui/calendar";
import TimePicker from "@/components/ui/time-picker";
import { Button } from "./button";

// parse YYYY-MM-DD thành Date local
function parseDateLocal(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// format Date thành YYYY-MM-DD
function formatDateLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { idUser, role, loading, logout } = useUser();
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
  const [dropdowFilterOpen, setDropdownFilterOpen] = useState(false);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const [filters, setFilters] = useState({
    checkinDate: "",
    checkoutDate: "",
    checkinTime: "",
    checkoutTime: "",
    city: "",
    area: "",
    tags: [] as string[], // multi-tag
    priceMin: "",
    priceMax: "",
  });

  const [cities, setCities] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  const isAuthPage = pathname.startsWith("/pages/auth");
  const isLoggedIn = !!idUser;

  const toggleDropdown = () => setDropdownMenuOpen((prev) => !prev);

  const handleMenuClick = (path: string) => {
    router.push(path);
    setDropdownMenuOpen(false);
  };

  const filtersRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Filter dropdown
      if (!filtersRef.current?.contains(target)) {
        setDropdownFilterOpen(false);
      }
      if (
        !tagsRef.current?.contains(target) &&
        !(target as HTMLElement).closest(".react-calendar") &&
        !(target as HTMLElement).closest(".time-picker-popup")
      ) {
        setTagsDropdownOpen(false);
      }

      // Profile menu dropdown
      if (!menuRef.current?.contains(target)) {
        setDropdownMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch city / area / tags from DB
  useEffect(() => {
    const fetchFilters = async () => {
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("city, area");
      const { data: tagsData } = await supabase.from("tags").select("name");
      if (roomsData) {
        setCities([
          ...new Set(roomsData.map((r: any) => r.city).filter(Boolean)),
        ]);
        setAreas([
          ...new Set(roomsData.map((r: any) => r.area).filter(Boolean)),
        ]);
      }
      if (tagsData) setTags(tagsData.map((t: any) => t.name));
    };
    fetchFilters();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

const handleFind = () => {
  if (filters.checkinDate && filters.checkoutDate) {
    const ci = new Date(
      `${filters.checkinDate}T${filters.checkinTime || "00:00"}`
    );
    const co = new Date(
      `${filters.checkoutDate}T${filters.checkoutTime || "23:59"}`
    );
    if (co <= ci) {
      alert("Checkout must be after check-in!");
      return;
    }
  }

  const query = new URLSearchParams();

  for (const key in filters) {
    const value = filters[key as keyof typeof filters];
    if (key === "tags") {
      // Push từng tag riêng lẻ
      (value as string[]).forEach((t) => query.append("tags", t));
    } else {
      if (value) query.set(key, value as string);
    }
  }

  router.push(`/pages/advanced_search?${query.toString()}`);
  setDropdownFilterOpen(false);
};

  const getMinTimeForToday = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? 30 : 0;
    const hours = minutes < 30 ? now.getHours() : now.getHours() + 1;
    return new Date(1970, 0, 1, hours, roundedMinutes, 0);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800 px-6 py-3 flex items-center justify-between z-50 transition-colors duration-300">
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <Image
          src="/logo.png"
          alt="Logo"
          width={40}
          height={40}
          className="dark:invert"
        />
        <span className="font-bold text-xl text-gray-800 dark:text-gray-100">
          Room Rental
        </span>
      </div>

      {/* Filters */}
      <div className="flex-1 mx-6 relative" ref={filtersRef}>
        <input
          type="text"
          placeholder="Find rooms..."
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          onFocus={() => setDropdownFilterOpen(!dropdowFilterOpen)}
          onClick={() => setDropdownFilterOpen(!dropdowFilterOpen)}
          readOnly
        />

        {dropdowFilterOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 space-y-3 z-50">
            <div className="flex gap-4 flex-wrap">
              {/* Check-in */}
              <div className="flex flex-col">
                <label className="text-sm mb-1">Check-in:</label>
                <Calendar
                  mode="single"
                  selected={
                    filters.checkinDate
                      ? parseDateLocal(filters.checkinDate)
                      : undefined
                  }
                  onSelect={(date) => {
                    if (!date) return;
                    const selectedDate = parseDateLocal(formatDateLocal(date));
                    const today = new Date();

                    setFilters((prev) => ({
                      ...prev,
                      checkinDate: formatDateLocal(date),
                      checkoutDate:
                        prev.checkoutDate &&
                        parseDateLocal(prev.checkoutDate) < date
                          ? ""
                          : prev.checkoutDate,
                      checkinTime:
                        selectedDate.toDateString() === today.toDateString()
                          ? getMinTimeForToday().toTimeString().slice(0, 5)
                          : "",
                    }));
                  }}
                  disabled={{ before: new Date() }}
                />
                <TimePicker
                  value={
                    filters.checkinTime
                      ? new Date(`1970-01-01T${filters.checkinTime}`)
                      : null
                  }
                  onChange={(date) => {
                    setFilters((prev) => ({
                      ...prev,
                      checkinTime: date.toTimeString().slice(0, 5),
                    }));
                  }}
                  disable={!filters.checkinDate}
                  minTime={
                    filters.checkinDate &&
                    parseDateLocal(filters.checkinDate).toDateString() ===
                      new Date().toDateString()
                      ? getMinTimeForToday()
                      : null
                  }
                />
              </div>

              {/* Check-out */}
              <div className="flex flex-col">
                <label className="text-sm mb-1">Check-out:</label>
                <Calendar
                  mode="single"
                  selected={
                    filters.checkoutDate
                      ? parseDateLocal(filters.checkoutDate)
                      : undefined
                  }
                  onSelect={(date) => {
                    if (!date) return;
                    const selectedDateStr = formatDateLocal(date);

                    setFilters((prev) => ({
                      ...prev,
                      checkoutDate: selectedDateStr,
                      // Nếu cùng ngày với checkin, set checkoutTime = checkinTime
                      checkoutTime:
                        prev.checkinDate === selectedDateStr
                          ? prev.checkinTime
                          : prev.checkoutTime,
                    }));
                  }}
                  disabled={
                    filters.checkinDate
                      ? { before: parseDateLocal(filters.checkinDate) }
                      : { before: new Date() }
                  }
                  month={
                    filters.checkinDate
                      ? parseDateLocal(filters.checkinDate)
                      : new Date()
                  }
                />
                <TimePicker
                  value={
                    filters.checkoutTime
                      ? new Date(`1970-01-01T${filters.checkoutTime}`)
                      : null
                  }
                  onChange={(date) => {
                    setFilters((prev) => ({
                      ...prev,
                      checkoutTime: date.toTimeString().slice(0, 5),
                    }));
                  }}
                  disable={!filters.checkoutDate}
                  minTime={
                    filters.checkinDate && filters.checkoutDate
                      ? parseDateLocal(filters.checkinDate).toDateString() ===
                        parseDateLocal(filters.checkoutDate).toDateString()
                        ? new Date(`1970-01-01T${filters.checkinTime}`) // ngày giống checkin -> minTime = checkinTime
                        : null // ngày khác -> không giới hạn
                      : null
                  }
                />
              </div>
            </div>

            {/* City / Area / Tags */}
            <div className="flex gap-2 flex-wrap">
              <div>
                <label className="text-sm">City:</label>
                <select
                  name="city"
                  value={filters.city}
                  onChange={handleChange}
                  className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm">Area:</label>
                <select
                  name="area"
                  value={filters.area}
                  onChange={handleChange}
                  className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col w-60 relative" ref={tagsRef}>
              <label className="text-sm">Tags:</label>

              {/* Input mở dropdown */}
              <input
                type="text"
                readOnly
                value=""
                placeholder="Select tags"
                onClick={() => setTagsDropdownOpen((prev) => !prev)}
                className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm w-full cursor-pointer"
              />

              {/* Dropdown multi-select */}
              {tagsDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50 p-2">
                  {tags.map((t) => (
                    <label
                      key={t}
                      className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(t)}
                        onChange={() => {
                          setFilters((prev) => {
                            const newTags = prev.tags.includes(t)
                              ? prev.tags.filter((tag) => tag !== t)
                              : [...prev.tags, t];
                            return { ...prev, tags: newTags };
                          });
                        }}
                        className="w-4 h-4"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              )}

              {/* Hiển thị tags đã chọn dưới input */}
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {filters.tags.map((t) => (
                    <span
                      key={t}
                      className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                    >
                      {t}
                      <button
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            tags: prev.tags.filter((tag) => tag !== t),
                          }))
                        }
                        className="text-white font-bold text-xs leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex gap-2 flex-wrap items-end">
              <div>
                <label className="text-sm">Min Price:</label>
                <input
                  type="number"
                  name="priceMin"
                  value={filters.priceMin}
                  onChange={handleChange}
                  className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm">Max Price:</label>
                <input
                  type="number"
                  name="priceMax"
                  value={filters.priceMax}
                  onChange={handleChange}
                  className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
                  min={0}
                />
              </div>
            </div>

            <button
              onClick={handleFind}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Find Room
            </button>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 relative">
        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
          </button>
        )}

        {/* Handle auth page */}
        {isAuthPage ? (
          <Button onClick={() => router.push("/")}>🏠 Home</Button>
        ) : (
          <>
            {/* Auth buttons or profile dropdown */}
            <div className="flex items-center gap-3 relative">
              {!loading && !isLoggedIn ? (
                <div className="flex gap-2">
                  <Button onClick={() => router.push("/pages/auth?mode=login")}>
                    Login
                  </Button>
                  <Button
                    onClick={() => router.push("/pages/auth?mode=register")}
                  >
                    Sign Up
                  </Button>
                </div>
              ) : isLoggedIn ? (
                <div className="relative" ref={menuRef}>
                  <button
                    className="flex items-center space-x-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 transition-colors duration-300"
                    onClick={toggleDropdown}
                  >
                    <Image
                      src={
                        localStorage.getItem("avatar_url") ||
                        "/avatar_default.jpg"
                      }
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="rounded-full ring-1 ring-gray-300 dark:ring-gray-600 transition-all duration-300"
                    />
                    <span className="font-medium text-gray-800 dark:text-gray-100 transition-colors duration-300">
                      {role}
                    </span>
                  </button>

                  {dropdownMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden animate-fadeIn transition-all duration-300 menu-dropdown">
                      <div className="absolute -top-2 right-4 w-3 h-3 bg-white/90 dark:bg-gray-800/90 transform rotate-45 border-t border-l border-gray-200 dark:border-gray-700"></div>

                      <div className="flex flex-col py-2">
                        {role === "landlord" && (
                          <button
                            className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 menu-dropdown"
                            onClick={() => handleMenuClick("/pages/rooms")}
                          >
                            Manage Rooms
                          </button>
                        )}
                        <button
                          className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 menu-dropdown"
                          onClick={() =>
                            handleMenuClick("/pages/history_bookings")
                          }
                        >
                          Booking History
                        </button>

                        <button
                          className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 menu-dropdown"
                          onClick={() => handleMenuClick("/pages/reports")}
                        >
                          Booking History
                        </button>

                        {role === "admin" && (
                          <button
                            className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 menu-dropdown"
                            onClick={() => handleMenuClick("/")}
                          >
                            Admin Dashboard
                          </button>
                        )}

                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                        <button
                          className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 menu-dropdown"
                          onClick={() =>
                            handleMenuClick(`/pages/user/${idUser}`)
                          }
                        >
                          Profile & Settings
                        </button>

                        <Button
                          onClick={logout}
                          className="bg-red-500 hover:bg-red-600 text-white w-full mt-2 rounded-md transition-colors duration-300 menu-dropdown"
                        >
                          Logout
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
