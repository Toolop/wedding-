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
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-primary">
        <p>Gagal memuat undangan. Silakan muat ulang halaman.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f2ee]">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <Heart className="h-8 w-8 fill-[#b7995f] text-[#b7995f]" />
        </motion.div>
        <p className="font-serif text-lg italic text-[#2e3237]/70">Memuat undangan...</p>
      </div>
    );
  }

  return <InvitationClient data={data} />;
}
