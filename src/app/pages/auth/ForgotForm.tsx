"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setFieldErrors({ general: error.message });
      } else {
        setMode("login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
                  key="forgot"
                  onSubmit={handleForgotPassword}
                  className="space-y-4"
                >
                  <input
                    type="email"
                    placeholder="Your email"
                    className="w-full border p-2 rounded"
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
                  {fieldErrors.general && (
                    <p className="text-red-500 text-sm">{fieldErrors.general}</p>
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
                    className="text-blue-600 hover:underline block mx-auto mt-2"
                  >
                    Back to login
                  </button>
                </form>
  )
}
