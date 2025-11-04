// src/context/UserContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";

interface UserContextType {
  idUser: string | null;
  role: string | null;
  loading: boolean;
  setUserFromServer: (id: string, role: string) => void;
  setLoading: (value: boolean) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [idUser, setIdUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", session.user.id)
          .single()

        if (profile) {
          setIdUser(profile.id);
          setRole(profile.role);
        }
      } else {
        setIdUser(null);
        setRole(null);
      }

      setLoading(false);
    };

    getUser();

    // 👇 Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const setUserFromServer = (id: string, role: string) => {
    setIdUser(id);
    setRole(role);
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Đăng xuất thành công!");
      localStorage.setItem("isLogin", "false");
      localStorage.setItem("avatar_url", "");
      setIdUser(null);
      setRole(null);
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Đăng xuất thất bại!");
    }
  };

  return (
    <UserContext.Provider
      value={{ idUser, role, loading, setUserFromServer, setLoading, logout }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};

export function Providers({ children }: { children: React.ReactNode }) {
	return <ThemeProvider attribute="class">{children}</ThemeProvider>;
}