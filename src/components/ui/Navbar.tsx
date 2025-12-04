"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/app/context/Usercontext";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";

import { NavbarBasicSearch } from "./NavbarBasicSearch";
import { NavbarAdvancedSearchContainer } from "./NavbarAdvancedSearchContainer";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { idUser, role, loading, logout, setLoading, avatarUrl } = useUser();

  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthPage = pathname.startsWith("/pages/auth");
  const isAdvancedSearchPage = pathname.startsWith("/pages/advanced_search");
  const isLoggedIn = !!idUser;
  const showBasicSearch = !isAdvancedSearchPage;

  useEffect(() => setMounted(true), []);

  const toggleDropdown = () => setDropdownMenuOpen((prev) => !prev);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setDropdownMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownMenuOpen]);

  const handleMenuClick = (path: string) => {
    router.push(path);
    setDropdownMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between z-50 transition-colors duration-300">
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => {
          router.push("/");
          setLoading(true);
        }}
      >
        <Image
          src="/logo.png"
          alt="Logo"
          width={40}
          height={40}
          className="dark:invert"
          style={{ width: "auto", height: "auto" }}
        />
        <span className="font-bold text-xl text-gray-800 dark:text-gray-100">
          Room Rental
        </span>
      </div>

      {/* Desktop search bar */}
      {role !== "admin" && !isAuthPage && (
        <div className="hidden md:flex flex-1 justify-center px-4">
          {showBasicSearch && <NavbarBasicSearch />}
          {isAdvancedSearchPage && (
            <NavbarAdvancedSearchContainer isAdvancedSearchPage={isAdvancedSearchPage} />
          )}
        </div>
      )}

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </button>
        )}

        {/* Desktop auth/profile */}
        <div className="hidden md:flex items-center gap-2 relative">
          {isAuthPage ? (
            <Button onClick={() => router.push("/")}>🏠 Home</Button>
          ) : !loading && !isLoggedIn ? (
            <>
              <Button onClick={() => router.push("/pages/auth?mode=login")}>Login</Button>
              <Button onClick={() => router.push("/pages/auth?mode=register")}>Sign Up</Button>
            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                className="flex items-center space-x-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 transition-colors duration-300"
                onClick={toggleDropdown}
              >
                <Image
                  src={avatarUrl || "/avatar_default.jpg"}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full ring-1 ring-gray-300 dark:ring-gray-600 transition-all duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "/avatar_default.jpg";
                  }}
                />
                <span className="font-medium text-gray-800 dark:text-gray-100 transition-colors duration-300">
                  {role}
                </span>
              </button>

              {dropdownMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden animate-fadeIn">
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
                    {role !== "admin" && (
                      <>
                        <button
                          className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                          onClick={() => handleMenuClick("/pages/history_bookings")}
                        >
                          Booking History
                        </button>
                        <button
                          className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                          onClick={() => handleMenuClick("/pages/reports")}
                        >
                          Reports
                        </button>
                      </>
                    )}
                    <button
                      className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                      onClick={() => handleMenuClick(`/pages/user/${idUser}`)}
                    >
                      Profile & Settings
                    </button>
                    <Button
                      onClick={logout}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 m-2 rounded-md transition-colors duration-300"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full bg-white dark:bg-gray-900 shadow-md p-4 flex flex-col gap-2">
          {role !== "admin" && !isAuthPage && showBasicSearch && <NavbarBasicSearch />}
          {isAuthPage ? (
            <Button onClick={() => handleMenuClick("/")}>🏠 Home</Button>
          ) : !loading && !isLoggedIn ? (
            <>
              <Button onClick={() => handleMenuClick("/pages/auth?mode=login")}>Login</Button>
              <Button onClick={() => handleMenuClick("/pages/auth?mode=register")}>Sign Up</Button>
            </>
          ) : (
            <>
              {role === "landlord" && (
                <Button onClick={() => handleMenuClick("/pages/rooms")}>Manage Rooms</Button>
              )}
              {role !== "admin" && (
                <>
                  <Button onClick={() => handleMenuClick("/pages/history_bookings")}>Booking History</Button>
                  <Button onClick={() => handleMenuClick("/pages/reports")}>Reports</Button>
                </>
              )}
              <Button onClick={() => handleMenuClick(`/pages/user/${idUser}`)}>Profile & Settings</Button>
              <Button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white">Logout</Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
