"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/app/context/Usercontext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotForm from "./ForgotForm";

export default function AuthPage() {
  const router = useRouter();
  const { setUserFromServer } = useUser();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Detect system dark mode preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDarkMode(prefersDark);

    // Optionally, you can persist this setting
    // localStorage.setItem("theme", prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (
      modeParam === "register" ||
      modeParam === "forgot" ||
      modeParam === "login"
    ) {
      setMode(modeParam);
    }
  }, [modeParam]);

  const changeModeAndSyncUrl = (newMode: "login" | "register" | "forgot") => {
    setMode(newMode);

    // Create new URL parameters, setting the 'mode'
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("mode", newMode);

    // Update the URL without a full page reload
    router.replace(`?${newSearchParams.toString()}`, { scroll: false });
  };

  // Helper function to get the correct background image URL
  const getBackgroundUrl = () => {
    switch (mode) {
      case "login":
        return "url('/bg-login.png')"; // Use the public path
      case "register":
        return "url('/bg-register.png')";
      case "forgot":
        return "url('/bg-forgot.png')";
      default:
        return "none"; // Default or fallback image
    }
  };

  // Define the base background classes for common styling
  const backgroundClasses = `bg-cover bg-center transition-all duration-500 ease-in-out`; // Add common classes

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${backgroundClasses}`}
      style={{
        backgroundImage: getBackgroundUrl(), // Set the image based on mode
      }}
    >
      <div
        className={`bg-white shadow-lg rounded-2xl p-8 w-full max-w-md relative overflow-hidden dark:bg-gray-800`}
      >
        <AnimatePresence mode="wait">
          <motion.h1
            key={mode}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-3xl font-bold text-center mb-6 ${
              mode === "login"
                ? "text-blue-600"
                : mode === "register"
                ? "text-green-600"
                : "text-yellow-600"
            } dark:text-white`}
          >
            {mode === "login"
              ? "🔐 Login"
              : mode === "register"
              ? "📝 Register"
              : "🔑 Forgot password"}
          </motion.h1>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {mode === "login" && (
            <LoginForm
              setMode={changeModeAndSyncUrl}
              setUserFromServer={setUserFromServer}
            />
          )}
          {mode === "register" && (
            <RegisterForm setMode={changeModeAndSyncUrl} />
          )}
          {mode === "forgot" && <ForgotForm setMode={changeModeAndSyncUrl} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
