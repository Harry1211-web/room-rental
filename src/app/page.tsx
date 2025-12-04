"use client";

import { useEffect, useState } from "react";
import { useUser } from "./context/Usercontext";
import { useAuthSync } from "./useAuthSync";
import AdminPage from "./pages/main/AdminPage";
import RecommendPage from "./pages/main/RecommendPage";
import { Footer } from "../components/Footer";

export default function Home() {
  const { role, loading, setLoading } = useUser();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false); 
  useEffect (() => {setLoading(false)})
  useAuthSync(60);

  const preloadImages = async () => {
    if (role === "admin") return; 

    setIsPreloading(true);

    const imagesToPreload = [
      "/loading.webp",
      "https://cdn-icons-png.flaticon.com/512/619/619153.png",
      
    ];

    //Preload the images
    const preloadPromises = imagesToPreload.map(src => new Promise(resolve => {
      const img = new Image();
      img.src = src;
      img.onload = resolve;
      img.onerror = resolve;
    }));

    await Promise.all(preloadPromises);

    setIsImageLoaded(true);
    setIsPreloading(false);
  };

  //Preload images only once, when the component mounts
  useEffect(() => {
    if (!loading) {
      preloadImages();
    }
  }, [loading, role]);

  if (loading || isPreloading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-24"> {/*Added flex layout */}
        {role === "admin" ? <AdminPage /> : <RecommendPage />}
      </main>
      {role !== "admin" && <Footer />} {/* Add footer component only for non-admin users */}
    </div>
  );
}
