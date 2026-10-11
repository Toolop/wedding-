"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import type { Settings } from "@/lib/types";
import { DoodleField, Emphasis, Heart, Illustration, WashBackdrop } from "./WatercolorArt";

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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#FAF5EC] px-6 text-center text-[#2B2522]"
    >
      <WashBackdrop />
      <DoodleField kind="love" />

      {/* dashed crayon border around the whole card */}
      <div className="crayon-box pointer-events-none absolute inset-4 rounded-[18px] sm:inset-6" />

      {/* the couple waving hello, with a heart and sparkle marks like the art */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.8, ease: "backOut" }}
        className="relative"
      >
        <Illustration name="hello" className="h-[30vh] max-h-64 w-auto" />
        <Heart color="#E9A195" className="absolute -right-3 top-2 h-8 w-auto" delay={0.9} />
        <Emphasis className="absolute -left-5 top-1/3 h-10 w-auto" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="font-eyebrow mb-1 mt-4 text-[11px] uppercase text-[#2B2522]/60"
      >
        The Wedding Of
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.9 }}
        className="font-script text-6xl font-bold leading-tight sm:text-7xl"
      >
        {settings.groom_name || "Groom"} &amp; {settings.bride_name || "Bride"}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-6 w-full max-w-xs"
      >
        {guestName && (
          <div
            className="wc crayon-box relative mb-6 rounded-[14px] px-6 py-4"
            style={{ backgroundColor: "#F7D9D2", boxShadow: "4px 4px 0 0 #E9B5AA" }}
          >
            <p className="font-eyebrow text-[9px] uppercase text-[#2B2522]/60">
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p className="mt-1.5 font-heading text-2xl">{guestName}</p>
          </div>
        )}

        <motion.button
          onClick={onOpen}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="wc crayon-pill group inline-flex items-center gap-2 rounded-full bg-[#3E4A6B] px-8 py-3.5 font-poster text-base text-[#FFF7EC] shadow-[4px_5px_0_0_#27304A]"
        >
          <Mail className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          Buka Undangan
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
