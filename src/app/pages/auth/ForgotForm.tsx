"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner"; // 1. Import toast for notifications

interface ForgotFormProps {
  setMode: (mode: "login" | "register" | "forgot") => void;
}

export default function ForgotForm({ setMode }: ForgotFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // 2. Add a success state to control the view
  const [isLinkSent, setIsLinkSent] = useState(false); 


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setFieldErrors({ email: "Email is required." });
      return;
    }

    setLoading(true);
    try {
      // Supabase default mailer template connects here
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setFieldErrors({ general: error.message });
        toast.error(error.message);
      } else {
        // 3. On success, show a notification and change to the success view
        setIsLinkSent(true); 
        toast.success("Password reset link sent! Check your email.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Render the success message or the form based on isLinkSent
  if (isLinkSent) {
    return (
      <div className="space-y-6 text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <p className="text-xl font-semibold text-green-500">
          Link Sent Successfully! 📬
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          We&apos;ve sent a password reset link to <span className="font-bold text-gray-800 dark:text-gray-100">{email}</span>. Please check your inbox and spam folder.
        </p>
        <button
          type="button"
          onClick={() => setMode("login")}
          className="text-blue-600 hover:underline block mx-auto mt-4"
        >
          Back to login
        </button>
      </div>
    );
  }

  // Original form rendering
  return (
    <form
      key="forgot"
      onSubmit={handleForgotPassword}
      className="space-y-4"
    >
      {/* ... (input and error fields remain the same) ... bruh*/}
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
        className="text-blue-600 hover:underline block mx-auto mt-2 dark:text-blue-400"
      >
        Back to login
      </button>
    </form>
  );
}