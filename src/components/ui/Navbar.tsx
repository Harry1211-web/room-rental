"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../../app/context/Usercontext";
import { Button } from "./button";
import Sidebar from "./Sidebar";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { idUser, role, loading, logout } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isAuthPage = pathname.startsWith("/pages/auth");
  const isLoggedIn = !!idUser;

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleMenuClick = (path: string) => {
    router.push(path);
    setDropdownOpen(false);
  };

  if (isAuthPage) {
    return (
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800 px-6 py-4 flex items-center justify-between z-50 transition-colors duration-300">
        <Button onClick={() => router.push("/")}>🏠 Home</Button>
      </nav>
    );
  }

  return (
    <div>
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800 px-6 py-4 flex items-center justify-between z-50 transition-colors duration-300">
        {/* Logo */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={0}
            height={0}
            sizes="100vw"
            className="h-10 w-auto sm:h-12 md:h-14 lg:h-16 dark:invert-0"
            priority
          />
          <span className="ml-2 font-bold text-xl text-gray-800 dark:text-gray-100 transition-colors duration-300">
            Room Rental
          </span>
        </div>

        {/* Search bar for tenants/landlords */}
        {role && role !== "admin" && !loading && (
          <div className="flex-1 mx-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search rooms..."
              className="w-full border border-gray-300 dark:border-gray-700 px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 outline-none transition-all duration-300"
            />
            <Button onClick={() => setSidebarOpen(!sidebarOpen)}>Filter</Button>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 relative">
          {/* Theme toggle */}
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

          {/* Auth buttons or profile dropdown */}
          {!loading && !isLoggedIn ? (
            <div className="flex gap-2">
              <Button onClick={() => router.push("/pages/auth?mode=login")}>Login</Button>
              <Button onClick={() => router.push("/pages/auth?mode=register")}>Sign Up</Button>
            </div>
          ) : isLoggedIn ? (
            <div className="relative">
              <button
                className="flex items-center space-x-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 transition-colors duration-300"
                onClick={toggleDropdown}
              >
                <Image
                  src={localStorage.getItem("avatar_url") || "/avatar_default.jpg"}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full ring-1 ring-gray-300 dark:ring-gray-600 transition-all duration-300"
                />
                <span className="font-medium text-gray-800 dark:text-gray-100 transition-colors duration-300">
                  {role}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden animate-fadeIn transition-all duration-300">
                  <div className="absolute -top-2 right-4 w-3 h-3 bg-white/90 dark:bg-gray-800/90 transform rotate-45 border-t border-l border-gray-200 dark:border-gray-700"></div>

                  <div className="flex flex-col py-2">
                    {role === "landlord" && (
                      <button
                        className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                        onClick={() => handleMenuClick("/pages/rooms")}
                      >
                        Manage Rooms
                      </button>
                    )}
                    {role === "tenant" && (
                      <button
                        className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                        onClick={() => handleMenuClick("/pages/history_bookings")}
                      >
                        Booking History
                      </button>
                    )}
                    {role === "admin" && (
                      <button
                        className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                        onClick={() => handleMenuClick("/")}
                      >
                        Admin Dashboard
                      </button>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                    <button
                      className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                      onClick={() => handleMenuClick(`/pages/user/${idUser}`)}
                    >
                      Profile & Settings
                    </button>

                    <Button
                      onClick={logout}
                      className="bg-red-500 hover:bg-red-600 text-white w-full mt-2 rounded-md transition-colors duration-300"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </nav>

      {/* Sidebar for filters */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
    </div>
  );
}
