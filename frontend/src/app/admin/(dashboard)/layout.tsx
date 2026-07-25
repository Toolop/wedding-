"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { getToken } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bridging localStorage auth check to render state
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8] text-sm text-[#8b7355]/60">
        Memeriksa sesi...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Toaster position="top-center" />
      {children}
    </div>
  );
}
