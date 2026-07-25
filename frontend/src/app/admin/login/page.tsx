"use client";

import { motion } from "framer-motion";
import { Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { adminLogin } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await adminLogin(username, password);
      setToken(token);
      toast.success("Login berhasil");
      router.push("/admin");
    } catch {
      toast.error("Username atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-6">
      <Toaster position="top-center" />
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#c9a876]">
          <Lock className="h-5 w-5 text-white" />
        </div>
        <h1 className="mt-4 text-center font-semibold text-lg text-[#8b7355]">
          Admin Login
        </h1>
        <p className="mt-1 text-center text-xs text-[#8b7355]/60">
          Kelola undangan pernikahan Anda
        </p>

        <div className="mt-6 space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="w-full rounded-xl border border-[#c9a876]/40 px-4 py-2.5 text-sm text-[#8b7355] outline-none focus:border-[#c9a876]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full rounded-xl border border-[#c9a876]/40 px-4 py-2.5 text-sm text-[#8b7355] outline-none focus:border-[#c9a876]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#8b7355] py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" />
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </motion.form>
    </div>
  );
}
