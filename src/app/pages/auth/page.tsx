"use client";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/app/context/Usercontext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotForm from "./ForgotForm";

function AuthContent() {
  const { setLoading } = useUser();
  const router = useRouter();
  const { setUserFromServer } = useUser();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDarkMode(prefersDark);
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

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("mode", newMode);

    router.replace(`?${newSearchParams.toString()}`, { scroll: false });
  };

  const getBackgroundUrl = () => {
    switch (mode) {
      case "login":
        return "url('/bg-login.png')";
      case "register":
        return "url('/bg-register.png')";
      case "forgot":
        return "url('/bg-forgot.png')";
      default:
        return "none";
    }
  };

  const backgroundClasses = `bg-cover bg-center transition-all duration-500 ease-in-out`;

  return (
    <div
      className={`
        min-h-screen flex items-start justify-center p-6
        ${mode === "login" ? "pt-60" : ""}
        ${mode === "register" ? "pt-32" : ""}
        ${mode === "forgot" ? "pt-72" : ""}
        ${backgroundClasses}
      `}
      style={{ backgroundImage: getBackgroundUrl() }}
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

export default function AuthPage() {
  return (
    // <Suspense fallback={
    //   <div className="min-h-screen flex items-center justify-center">
    //     <div className="text-center">
    //       <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    //       <p className="text-gray-600">Loading authentication...</p>
    //     </div>
    //   </div>
    // }>
    <AuthContent />
    // </Suspense>
  );
}
