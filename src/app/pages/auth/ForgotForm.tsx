"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface ForgotFormProps {
  setMode: (mode: "login" | "register" | "forgot") => void;
}

export default function ForgotForm({ setMode }: ForgotFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setFieldErrors({ email: "Email is required." });
      return;
    }

    setLoading(true);
    setFieldErrors({});
    toast.success("📩 If your email exists, a reset link will be sent shortly!");

    try {
      //Fire and forget: don't wait for the email to actually arrive
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/pages/reset-password`,
      }).catch((err) => {
        console.error("Forgot password email error:", err);
      });
    } finally {
      setLoading(false);
      setMode("login"); //Go back to login immediately
    }
  };

  return (
    <form key="forgot" onSubmit={handleForgotPassword} className="space-y-4">
      <input
        type="email"
        placeholder="Your email"
        className="w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-yellow-500"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (fieldErrors.email)
            setFieldErrors((prev) => ({ ...prev, email: "" }));
        }}
      />
      {fieldErrors.email && (
        <p className="text-red-500 text-sm">{fieldErrors.email}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition"
      >
        {loading ? "Sending..." : "Send reset link"}
      </button>
      <button
        type="button"
        onClick={() => setMode("login")}
        className="text-blue-600 hover:underline block mx-auto mt-2 dark:text-blue-400"
      >
        Back to login
      </button>
    </form>
  );
}
