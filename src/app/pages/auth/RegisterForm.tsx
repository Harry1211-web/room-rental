"use client";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import {
  validateRegisterFields,
  handleStrongPassword,
} from "./helpers/validation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface RegisterFormProps {
  setMode: (mode: "login" | "register" | "forgot") => void;
}

export default function RegisterForm({ setMode }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"tenant" | "landlord">("tenant");
  const [password, setPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avt, setAvt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    const { valid, errors } = handleStrongPassword(value);
    // nếu rỗng vẫn hiện quy tắc
    if (!value.trim()) {
      setPasswordErrors(errors);
    } else {
      setPasswordErrors(valid ? [] : errors);
    }

    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateRegisterFields(
      name,
      email,
      phone,
      password,
      confirmationPassword
    );
    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      const { data: existingEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)

        if (existingEmail && existingEmail.length < 0) {
        setFieldErrors((prev) => ({ ...prev, email: "Email already exists" }));
        return;
      }

      const { data: existingPhone } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", phone)

      if (existingPhone && existingPhone?.length < 0) {
        setFieldErrors((prev) => ({ ...prev, phone: "Phone number already exists" }));
        return;
      }


      // --- 1️⃣ Đăng ký tài khoản trước để có userId ---
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              phone_number: phone,
              role: role,
            },
          },
        });
      console.log("signUp:", { signUpData, signUpError });

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

      // --- 2️⃣ Upload avatar (nếu có) ---
      let avatarUrl: string | null = null;

      if (avt) {
        const formData = new FormData();
        formData.append("file", avt);
        formData.append("userId", userId);

        const res = await fetch("/api/avatar", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        avatarUrl = data.avatarUrl;
      }

      if (!avatarUrl) {
        avatarUrl =
          "https://bfohmdgcgylgbdmpqops.supabase.co/storage/v1/object/public/avatars/avatar_default.jpg";
      }

      // Sau khi update user metadata
      await supabaseAdmin
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      // --- 5️⃣ Hiển thị toast ---
      toast.success("📩 Please confirm your email before logging in.");

      // --- 6️⃣ Điều hướng ---
      setMode("login");
    } catch (err) {
      console.error("Error in register:", err);
      setFieldErrors({ general: "Unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form key="register" onSubmit={handleRegister} className="space-y-3">
      {/* NAME */}
      <div>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name)
              setFieldErrors((prev) => ({ ...prev, name: "" }));
          }}
          className="w-full border p-2 rounded"
        />
        {fieldErrors.name && (
          <p className="text-red-500 text-sm">{fieldErrors.name}</p>
        )}
      </div>

      {/* EMAIL */}
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email)
              setFieldErrors((prev) => ({ ...prev, email: "" }));
          }}
          className="w-full border p-2 rounded"
        />
        {fieldErrors.email && (
          <p className="text-red-500 text-sm">{fieldErrors.email}</p>
        )}
      </div>

      {/* PHONE */}
      <div>
        <input
          type="text"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (fieldErrors.phone)
              setFieldErrors((prev) => ({ ...prev, phone: "" }));
          }}
          className="w-full border p-2 rounded"
        />
        {fieldErrors.phone && (
          <p className="text-red-500 text-sm">{fieldErrors.phone}</p>
        )}
      </div>

      {/* PASSWORD */}
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          className="w-full border p-2 rounded"
        />

        {/* lỗi required */}
        {fieldErrors.password && (
          <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
        )}

        {/* luôn hiển thị quy tắc nếu ở register mode */}
        {passwordErrors.length > 0 ? (
          <ul className="text-red-500 text-sm mt-1 list-disc pl-5">
            {passwordErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        ) : (
          password && (
            <p className="text-green-500 text-sm mt-1">Strong password ✅</p>
          )
        )}
      </div>

      {/* CONFIRM PASSWORD */}
      <div>
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmationPassword}
          onChange={(e) => {
            setConfirmationPassword(e.target.value);
            if (fieldErrors.confirmationPassword)
              setFieldErrors((prev) => ({
                ...prev,
                confirmationPassword: "",
              }));
          }}
          className="w-full border p-2 rounded"
        />
        {fieldErrors.confirmationPassword && (
          <p className="text-red-500 text-sm">
            {fieldErrors.confirmationPassword}
          </p>
        )}
      </div>

      {/* ROLE */}
      <div className="flex items-center space-x-6 mt-2">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="role"
            value="tenant"
            checked={role === "tenant"}
            onChange={() => setRole("tenant")}
          />
          <span>Tenant</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="role"
            value="landlord"
            checked={role === "landlord"}
            onChange={() => setRole("landlord")}
          />
          <span>Landlord</span>
        </label>
      </div>

      {/* AVATAR */}
      <div>
        <label className="block text-sm font-medium mb-1 mt-2">Avatar</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setAvt(file || null);
            if (fieldErrors.avt)
              setFieldErrors((prev) => ({ ...prev, avt: "" }));
          }}
        />
        {fieldErrors.avt && (
          <p className="text-red-500 text-sm">{fieldErrors.avt}</p>
        )}
        {avt && (
          <div className="relative w-24 h-24 mt-2">
            <Image
              src={URL.createObjectURL(avt)}
              alt="Preview"
              fill
              className="object-cover rounded-full"
            />
          </div>
        )}
      </div>

      {fieldErrors.general && (
        <p className="text-red-500 text-sm">{fieldErrors.general}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
      >
        {loading ? "Registering..." : "Sign up"}
      </button>

      <p className="text-sm text-center mt-2">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => setMode("login")}
          className="text-blue-600 hover:underline"
        >
          Login
        </button>
      </p>
    </form>
  );
}
