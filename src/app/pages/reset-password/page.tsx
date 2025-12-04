"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader } from "@/components/Loader";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import {
  handleStrongPassword,
  validateConfirmationPassword,
} from "../auth/helpers/validation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = searchParams.get("access_token");

  // Apply recovery session
  useEffect(() => {
    const setupSession = async () => {
      if (!token) {
        toast.error("Invalid or missing reset token.");
        setLoading(false);
        return;
      }

      // Correct Supabase reset flow
      const { error } = await supabase.auth.exchangeCodeForSession(token);

      if (error) {
        toast.error("Reset link is expired or invalid.");
      }

      setLoading(false);
    };

    setupSession();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { valid, errors } = handleStrongPassword(newPassword);
    setPasswordErrors(errors);
    if (!valid) {
      toast.error("Password is too weak.");
      return;
    }

    const confirmErr = validateConfirmationPassword(
      newPassword,
      confirmPassword
    );
    setConfirmError(confirmErr);
    if (confirmErr) return;

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    toast.success("Password updated! Redirecting...");
    setTimeout(() => router.push("/auth?mode=login"), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 w-full max-w-md">

        {loading ? (
          <Loader message="Validating reset link... 🔒" />
        ) : (
          <>
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
              Reset Your Password
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* New Password */}
              <div>
                <input
                  type="password"
                  placeholder="New password"
                  className={`w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                    ${
                      passwordErrors.length > 0
                        ? "border-red-500"
                        : "dark:border-gray-700 border-gray-300"
                    }
                    focus:ring-2 focus:ring-yellow-500`}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordErrors([]);
                  }}
                />
                {passwordErrors.length > 0 && (
                  <ul className="text-red-500 text-sm mt-1 space-y-1">
                    {passwordErrors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className={`w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                    ${
                      confirmError
                        ? "border-red-500"
                        : "dark:border-gray-700 border-gray-300"
                    }
                    focus:ring-2 focus:ring-yellow-500`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmError("");
                  }}
                />
                {confirmError && (
                  <p className="text-red-500 text-sm mt-1">{confirmError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition"
              >
                {submitting ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
