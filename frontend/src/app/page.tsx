"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { getInvitation } from "@/lib/api";
import type { InvitationData } from "@/lib/types";
import InvitationClient from "@/components/InvitationClient";

export default function Home() {
  const [data, setData] = useState<InvitationData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    getInvitation()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF5EC] px-6 text-center text-[#2B2522]">
        <p className="font-heading text-xl">Gagal memuat undangan. Silakan muat ulang halaman.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAF5EC]">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <Heart className="h-9 w-9 fill-[#E9A195] text-[#2B2522]" strokeWidth={1.6} />
        </motion.div>
        <p className="font-script text-2xl text-[#2B2522]/75">Memuat undangan...</p>
      </div>
    );
  }

  return <InvitationClient data={data} />;
}
