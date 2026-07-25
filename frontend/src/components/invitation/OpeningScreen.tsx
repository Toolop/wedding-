"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import type { Settings } from "@/lib/types";
import MagicSparkles from "./MagicSparkles";

export default function OpeningScreen({
  settings,
  onOpen,
}: {
  settings: Settings;
  onOpen: () => void;
}) {
  const [guestName, setGuestName] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads from URL query, not available during SSR
    if (to) setGuestName(decodeURIComponent(to.replace(/\+/g, " ")));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-surface px-6 text-center"
      style={
        settings.hero_image
          ? {
              backgroundImage: `linear-gradient(to bottom, rgba(244,242,238,0.62), rgba(244,242,238,0.88)), url(${mediaUrl(
                settings.hero_image
              )})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <MagicSparkles />

      {/* engraved inner border */}
      <div className="pointer-events-none absolute inset-4 rounded-[2px] border border-gold/30 sm:inset-6" />

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="font-label mb-3 text-[11px] text-primary/60"
      >
        The Wedding Of
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.9 }}
        className="font-vibes text-6xl leading-tight text-primary sm:text-7xl"
      >
        {settings.groom_name || "Groom"} &amp; {settings.bride_name || "Bride"}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-10 w-full max-w-xs"
      >
        {guestName && (
          <div className="relative mb-6 border-y border-gold/40 bg-surface/70 px-6 py-4 text-primary backdrop-blur-sm">
            <p className="font-label text-[9px] text-primary/60">
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p className="mt-1.5 font-serif text-2xl font-medium">{guestName}</p>
          </div>
        )}

        <motion.button
          onClick={onOpen}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-3.5 font-label text-[11px] text-surface shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/35"
        >
          <Mail className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          Buka Undangan
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
