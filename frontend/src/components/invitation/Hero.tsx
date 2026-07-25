"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import type { Settings } from "@/lib/types";
import MagicSparkles from "./MagicSparkles";
import Ornament from "./Ornament";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function Hero({ settings }: { settings: Settings }) {
  return (
    <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      {settings.hero_image ? (
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(244,242,238,0.42), rgba(244,242,238,0.6) 55%, rgba(244,242,238,0.95)), url(${mediaUrl(
              settings.hero_image
            )})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-secondary" />
      )}
      <MagicSparkles />

      {/* delicate inner border, like an engraved card */}
      <div className="pointer-events-none absolute inset-4 -z-[5] rounded-[2px] border border-gold/25 sm:inset-6" />

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="font-label text-[11px] text-primary/60"
      >
        The Wedding Of
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, delay: 0.15 }}
        className="mt-5 font-vibes text-6xl leading-[1.05] text-primary sm:text-8xl"
      >
        {settings.groom_name}
        <span className="mx-2 align-middle text-4xl text-gold sm:text-5xl">&amp;</span>
        {settings.bride_name}
      </motion.h1>

      <Ornament className="mt-6" width={220} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-7 inline-flex flex-col items-center gap-1 border-y border-gold/40 px-8 py-3"
      >
        <span className="font-label text-[10px] text-accent/70">Save The Date</span>
        <span className="font-serif text-2xl font-medium tracking-wide text-primary">
          {formatDate(settings.wedding_date)}
        </span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-12 z-10 text-primary/50"
      >
        <ChevronDown className="h-6 w-6" />
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
    </section>
  );
}
