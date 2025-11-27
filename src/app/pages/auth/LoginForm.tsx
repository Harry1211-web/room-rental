"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from 'lucide-react'

interface LoginFormProps {
  setMode: (mode: "login" | "register" | "forgot") => void;
  setUserFromServer: (id: string, role: string) => void;
}

export default function LoginForm({
  setMode,
  setUserFromServer,
}: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required.";
    if (!password.trim()) newErrors.password = "Password is required.";
    if (Object.keys(newErrors).length > 0) return setFieldErrors(newErrors);

    setLoading(true);
    try {
      // 🔹 1. Đăng nhập Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setFieldErrors({
          general: error.message.includes("Invalid login credentials")
            ? "Invalid email or password."
            : error.message,
        });
        return;
      }

      const user = data.user;

      // 🔹 2. Lấy role từ bảng public.Users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, avatar_url")
        .eq("id", user.id)
        .single();
      if (userError) {
        console.error(
          "Error fetching user role:",
          userError?.message || userError
        );
        toast.error(
          `Failed to load user role: ${userError?.message || "unknown error"}`
        );
        setFieldErrors({ general: "Failed to load user information." });
        return;
      }
      console.log(userData.role);
      // 🔹 3. Lưu session đăng nhập
      localStorage.setItem("isLogin", "true");

      // 🔹 Lưu avatar vào localStorage (nếu muốn)
      localStorage.setItem("avatar_url", userData.avatar_url ?? "");

      // 🔹 4. Cập nhật state bên ngoài (nếu cần)
      setUserFromServer(user.id, userData.role);

      toast.success("Login successful");

      // 🔹 5. Chuyển hướng về trang chủ
      router.push("/");
    } catch (err) {
      console.error("Unexpected error:", err);
      setFieldErrors({ general: "Unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        className="w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {fieldErrors.email && (
        <p className="text-red-500 text-sm">{fieldErrors.email}</p>
      )}

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          className="w-full border p-2 pr-10 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Toggle */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300"
        >
          {showPassword ? <Eye /> : <EyeOff />}
        </button>
      </div>

      {fieldErrors.password && (
        <p className="text-red-500 text-sm">{fieldErrors.password}</p>
      )}

      {fieldErrors.general && (
        <p className="text-red-500 text-sm">{fieldErrors.general}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded dark:bg-blue-500 dark:hover:bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        {loading ? "Processing..." : "Login"}
      </button>

      <div className="flex justify-between text-sm mt-2">
        <button
          type="button"
          onClick={() => setMode("forgot")}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className="text-green-600 hover:underline dark:text-green-400"
        >
          Register
        </button>
      </div>
    </form>
  );
}
