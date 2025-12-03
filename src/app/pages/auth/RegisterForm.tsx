"use client";

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Image from "next/image";
import {
  handleStrongPassword,
  validateEmail,
  validatePhone,
  validateName,
  validateConfirmationPassword
} from "./helpers/validation";

interface RegisterFormProps {
  setMode: (mode: "login" | "register" | "forgot") => void;
}

export default function RegisterForm({ setMode }: RegisterFormProps) {
  // ===== State =====
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"tenant" | "landlord">("tenant");
  const [password, setPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [avt, setAvt] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ===== Handlers =====
  const handleNameChange = (value: string) => {
    setName(value);
    setFieldErrors(prev => ({ ...prev, name: validateName(value) }));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setFieldErrors(prev => ({ ...prev, email: validateEmail(value) }));
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setFieldErrors(prev => ({ ...prev, phone: validatePhone(value) }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const { valid, errors } = handleStrongPassword(value);
    setPasswordErrors(!value.trim() ? errors : valid ? [] : errors);

    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
    // Re-validate confirmation password when password changes
    setFieldErrors(prev => ({
      ...prev,
      confirmationPassword: validateConfirmationPassword(value, confirmationPassword)
    }));
  };

  const handleConfirmationChange = (value: string) => {
    setConfirmationPassword(value);
    setFieldErrors(prev => ({
      ...prev,
      confirmationPassword: validateConfirmationPassword(password, value)
    }));
  };

  const handleAvatarChange = (file: File | null) => {
    setAvt(file);
    if (fieldErrors.avt) setFieldErrors(prev => ({ ...prev, avt: "" }));
  };

  // ===== Final form validation on submit =====
  const validateFieldsOnSubmit = () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = "Full name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    if (!phone.trim()) errors.phone = "Phone number is required.";
    if (!password) errors.password = "Password is required.";
    if (!confirmationPassword) errors.confirmationPassword = "Confirm password is required.";
    if (password && confirmationPassword && password !== confirmationPassword)
      errors.confirmationPassword = "Passwords do not match.";
    if (phone && !/^\d{10}$/.test(phone))
      errors.phone = "Phone number must be 10 digits.";

    return errors;
  };

  // ===== Form submit =====
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateFieldsOnSubmit();
    setFieldErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", email);

      if (existingEmail?.length) {
        setFieldErrors(prev => ({ ...prev, email: "Email already exists." }));
        setLoading(false);
        return;
      }

      // Check if phone already exists
      const { data: existingPhone } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", phone);

      if (existingPhone?.length) {
        setFieldErrors(prev => ({ ...prev, phone: "Phone number already exists." }));
        setLoading(false);
        return;
      }

      // Sign up user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone_number: phone, role }
        }
      });

      if (signUpError) {
        setFieldErrors({ general: signUpError.message });
        setLoading(false);
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        setFieldErrors({ general: "Cannot get user ID after sign up." });
        setLoading(false);
        return;
      }

      // ✅ Show success immediately
      toast.success("📩 Account created! Please confirm your email.");
      setMode("login");

      // Background avatar upload
      (async () => {
        try {
          let avatarUrl = "https://bfohmdgcgylgbdmpqops.supabase.co/storage/v1/object/public/avatars/avatar_default.jpg";

          if (avt) {
            const formData = new FormData();
            formData.append("file", avt);
            formData.append("userId", userId);

            const res = await fetch("/api/avatar", { method: "POST", body: formData });
            const data = await res.json();
            if (res.ok) avatarUrl = data.avatarUrl;
          }

          await supabaseAdmin.from("users").update({ avatar_url: avatarUrl }).eq("id", userId);
        } catch (err) {
          console.error("Background avatar update error:", err);
        }
      })();

    } catch (err) {
      console.error("Registration error:", err);
      setFieldErrors({ general: "Unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  // ===== JSX =====
  return (
    <form onSubmit={handleRegister} className="space-y-3">

      {/* Name */}
      <input
        type="text"
        placeholder="Full name"
        value={name}
        onChange={e => handleNameChange(e.target.value)}
        className="w-full border p-2 rounded"
      />
      {fieldErrors.name && <p className="text-red-500 text-sm">{fieldErrors.name}</p>}

      {/* Email */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => handleEmailChange(e.target.value)}
        className="w-full border p-2 rounded"
      />
      {fieldErrors.email && <p className="text-red-500 text-sm">{fieldErrors.email}</p>}

      {/* Phone */}
      <input
        type="text"
        placeholder="Phone number"
        value={phone}
        onChange={e => handlePhoneChange(e.target.value)}
        className="w-full border p-2 rounded"
      />
      {fieldErrors.phone && <p className="text-red-500 text-sm">{fieldErrors.phone}</p>}

      {/* Password */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => handlePasswordChange(e.target.value)}
        className="w-full border p-2 rounded"
      />
      {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
      {passwordErrors.length > 0 ? (
        <ul className="text-red-500 text-sm mt-1 list-disc pl-5">
          {passwordErrors.map((err, i) => <li key={i}>{err}</li>)}
        </ul>
      ) : password && <p className="text-green-500 text-sm mt-1">Strong password ✅</p>}

      {/* Confirm Password */}
      <input
        type="password"
        placeholder="Confirm password"
        value={confirmationPassword}
        onChange={e => handleConfirmationChange(e.target.value)}
        className="w-full border p-2 rounded"
      />
      {fieldErrors.confirmationPassword && <p className="text-red-500 text-sm">{fieldErrors.confirmationPassword}</p>}

      {/* Role */}
      <div className="flex items-center space-x-6 mt-2">
        <label className="flex items-center space-x-2">
          <input type="radio" name="role" value="tenant" checked={role === "tenant"} onChange={() => setRole("tenant")} /> Tenant
        </label>
        <label className="flex items-center space-x-2">
          <input type="radio" name="role" value="landlord" checked={role === "landlord"} onChange={() => setRole("landlord")} /> Landlord
        </label>
      </div>

      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium mb-1 mt-2">Avatar</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => handleAvatarChange(e.target.files?.[0] || null)}
        />
        {fieldErrors.avt && <p className="text-red-500 text-sm">{fieldErrors.avt}</p>}
        {avt && (
          <div className="relative w-24 h-24 mt-2">
            <Image src={URL.createObjectURL(avt)} alt="Preview" fill className="object-cover rounded-full" />
          </div>
        )}
      </div>

      {fieldErrors.general && <p className="text-red-500 text-sm">{fieldErrors.general}</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
      >
        {loading ? "Registering..." : "Sign up"}
      </button>

      {/* Switch to login */}
      <p className="text-sm text-center mt-2">
        Already have an account?{" "}
        <button type="button" onClick={() => setMode("login")} className="text-blue-600 hover:underline">
          Login
        </button>
      </p>
    </form>
  );
}
