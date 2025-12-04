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

  //Apply recovery session
  useEffect(() => {
    const setupSession = async () => {
      if (!token) {
        toast.error("Invalid or missing reset token.");
        setLoading(false);
        return;
      }

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

    const confirmErr = validateConfirmationPassword(newPassword, confirmPassword);
    setConfirmError(confirmErr);
    if (confirmErr) return;

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    toast.success("Password updated! Redirecting...");
    setTimeout(() => router.push("/"), 1500);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-900">
      {/* Blurred background */}
      <div className="absolute inset-0">
        <img
          src="/bg-register.png" /* Using register bg as placeholder */
          alt="Background"
          className="w-full h-full object-cover filter blur-sm brightness-50"
        />
      </div>

      {/* Form card */}
      <div className="relative z-10 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 w-full max-w-md">
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
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    const { valid, errors } = handleStrongPassword(e.target.value);
                    setPasswordErrors(errors);
                  }}
                  className={`w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    ${passwordErrors.length > 0 ? "border-red-600" : "border-gray-300 dark:border-gray-600"}
                    focus:ring-2 focus:ring-green-500 transition`}
                />
                {passwordErrors.length > 0 ? (
                  <ul className="text-red-600 text-sm mt-1 space-y-1 list-disc pl-5">
                    {passwordErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                ) : newPassword ? (
                  <p className="text-green-600 text-sm mt-1">Strong password ✅</p>
                ) : null}
              </div>

              {/* Confirm Password */}
              <div>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmError(validateConfirmationPassword(newPassword, e.target.value));
                  }}
                  className={`w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    ${confirmError ? "border-red-600" : "border-gray-300 dark:border-gray-600"}
                    focus:ring-2 focus:ring-green-500 transition`}
                />
                {confirmError && (
                  <p className="text-red-600 text-sm mt-1">{confirmError}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
              >
                {submitting ? "Updating..." : "Update Password"}
              </button>

              {/* Back to login */}
              <p className="text-sm text-center mt-2">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-indigo-600 hover:underline"
                >
                  Login
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
