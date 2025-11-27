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
  avatarUrl: string | null;
  setUserFromServer: (id: string, role: string) => void;
  setLoading: (value: boolean) => void;
  logout: () => Promise<void>;
  updateAvatar: (url: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [idUser, setIdUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("id, role, avatar_url")
          .eq("id", session.user.id)
          .single()

        if (profile) {
          setIdUser(profile.id);
          setRole(profile.role);
          setAvatarUrl(profile.avatar_url);
          
          // Store in localStorage for quick access (optional)
          if (profile.avatar_url) {
            localStorage.setItem("avatar_url", profile.avatar_url);
          }
        }
      } else {
        setIdUser(null);
        setRole(null);
        setAvatarUrl(null);
        localStorage.setItem("avatar_url", "");
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

  const updateAvatar = (url: string) => {
    setAvatarUrl(url);
    localStorage.setItem("avatar_url", url);
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIdUser(null);
      setRole(null);
      setAvatarUrl(null);
      toast.success("Logout successfully!");
      localStorage.setItem("isLogin", "false");
      localStorage.setItem("avatar_url", "");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Logout failed!");
    }
  };

  return (
    <UserContext.Provider
      value={{ 
        idUser, 
        role, 
        loading, 
        avatarUrl,
        setUserFromServer, 
        setLoading, 
        logout,
        updateAvatar 
      }}
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