
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/app/context/Usercontext";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";

//Import the specialized search components
import { NavbarBasicSearch } from "./NavbarBasicSearch";
import { NavbarAdvancedSearchContainer } from "./NavbarAdvancedSearchContainer"; 

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { idUser, role, loading, logout, setLoading } = useUser();
  
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const isAuthPage = pathname.startsWith("/pages/auth");
  const isAdvancedSearchPage = pathname.startsWith("/pages/advanced_search");
  const isLoggedIn = !!idUser;

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const toggleDropdown = () => setDropdownMenuOpen((prev) => !prev);

  const handleMenuClick = (path: string) => {
    router.push(path);
    setDropdownMenuOpen(false);
  };

  //Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setDropdownMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownMenuOpen]);
  
  //Determine which search bar to show in the center
  const showBasicSearch = !isAdvancedSearchPage; 

  return (
    <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800 px-6 py-3 flex items-center justify-between z-50 transition-colors duration-300">
      
      {/* 1. Logo */}
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
          style={{ width: "auto", height: "auto" }}
          onClick={() => {setLoading(true)}}
        />
        <span className="font-bold text-xl text-gray-800 dark:text-gray-100">
          Room Rental
        </span>
      </div>

      {/* 2. Center Search/Filter Area */}
      {role !== "admin" && !isAuthPage && (
        <> 
              {showBasicSearch && <NavbarBasicSearch />}
              {isAdvancedSearchPage && <NavbarAdvancedSearchContainer isAdvancedSearchPage={isAdvancedSearchPage} />}
        </>
      )}


      {/* 3. Right side - Theme Toggle, Auth/Profile */}
      <div className="flex items-center gap-3 relative">
        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => {setTheme(theme === "light" ? "dark" : "light")}}
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

        {/* Auth buttons / Home button / Profile dropdown */}
        {isAuthPage ? (
          <Button onClick={() => router.push("/")}>🏠 Home</Button>
        ) : (
          <>
            <div className="flex items-center gap-3 relative">
              {!loading && !isLoggedIn ? (
                <div className="flex gap-2">
                  <Button onClick={() => {router.push("/pages/auth?mode=login"), setLoading(true)}}>
                    Login
                  </Button>
                  <Button
                    onClick={() => {router.push("/pages/auth?mode=register"), setLoading(true)}}
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
                        localStorage.getItem("avatar_url") || "/avatar_default.jpg"
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
                            onClick={() => {handleMenuClick("/pages/rooms"), setLoading(true)}}
                          >
                            Manage Rooms
                          </button>
                        )}
                        {role !== "admin" && (
                          <>
                          <button
                          className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 menu-dropdown"
                          onClick={() => {handleMenuClick("/pages/history_bookings"), setLoading(true)}}
                        >
                          Booking History
                        </button>

                        <button
                          className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 menu-dropdown"
                          onClick={() => {handleMenuClick("/pages/reports"), setLoading(true)}}
                        >
                          Reports
                        </button>
                        </>
                        )}


                        <button
                          className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 menu-dropdown"
                          onClick={() => {handleMenuClick(`/pages/user/${idUser}`), setLoading(true)}}
                        >
                          Profile & Settings
                        </button>

                        <Button
                          onClick={logout}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 m-2 rounded-md transition-colors duration-300 menu-dropdown"
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