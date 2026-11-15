"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getInvitation } from "@/lib/api";
import type { InvitationData } from "@/lib/types";
import InvitationClient from "@/components/InvitationClient";
import { Monogram } from "@/components/invitation/classy";
import { resolveGuestAccess, type GuestAccess } from "@/components/invitation/guest";

export default function Home() {
  const [data, setData] = useState<InvitationData | null>(null);
  const [access, setAccess] = useState<GuestAccess>({ status: "missing" });
  const [error, setError] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    // resolve the guest first so the opening card already greets them by name
    Promise.all([getInvitation(), resolveGuestAccess()])
      .then(([invitation, checked]) => {
        setAccess(checked);
        setData(invitation);
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-6 text-center text-ink">
        <p className="font-script text-xl">Gagal memuat undangan. Silakan muat ulang halaman.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <Monogram a="R" b="T" size={56} />
        </motion.div>
        <p className="font-script text-2xl text-muted">Memuat undangan…</p>
      </div>
    );
  }

  return <InvitationClient data={data} access={access} />;
}
