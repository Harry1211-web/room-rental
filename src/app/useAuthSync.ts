"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function useAuthSync(timeoutMinutes = 60) {
  const router = useRouter();

  useEffect(() => {
    // --- Lắng nghe thay đổi phiên đăng nhập ---
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          router.push("/");
          localStorage.setItem("isLogin", "false");
        }
      }
    );

    // --- Bộ đếm tự logout sau khi không hoạt động ---
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        supabase.auth.signOut();
        router.push("/");
        localStorage.setItem("isLogin", "false");
      }, timeoutMinutes * 60 * 1000);
    };

    ["mousemove", "keydown", "click"].forEach((e) =>
      window.addEventListener(e, resetTimer)
    );
    resetTimer();

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
      ["mousemove", "keydown", "click"].forEach((e) =>
        window.removeEventListener(e, resetTimer)
      );
    };
  }, [router, timeoutMinutes]);
}
