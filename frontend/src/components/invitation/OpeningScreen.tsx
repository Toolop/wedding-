"use client";

import { motion } from "framer-motion";
import { Lock, Mail, RotateCw } from "lucide-react";
import type { Settings } from "@/lib/types";
import { FlowerFrame } from "./Flowers";
import { useInvitedGuest } from "./guest";
import { DoodleField, Emphasis, Heart, Illustration, WashBackdrop } from "./WatercolorArt";

const BLOCKED_TEXT = {
  missing: {
    title: "Undangan ini bersifat pribadi",
    body: "Silakan buka lewat link yang kami kirimkan ke WhatsApp Anda.",
  },
  invalid: {
    title: "Link undangan tidak valid",
    body: "Link-nya mungkin terpotong atau sudah diganti. Silakan buka lewat link terbaru yang kami kirimkan.",
  },
  error: {
    title: "Belum bisa memeriksa link",
    body: "Periksa koneksi internet Anda, lalu coba lagi sebentar lagi.",
  },
} as const;

export default function OpeningScreen({
  settings,
  blocked,
  onOpen,
}: {
  settings: Settings;
  /** why this visit can't open the invitation, or null when it can */
  blocked: keyof typeof BLOCKED_TEXT | null;
  onOpen: () => void;
}) {
  const guestName = useInvitedGuest()?.name;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#F2F6EF] px-6 text-center text-[#2F3D35]"
    >
      <WashBackdrop />
      <FlowerFrame />
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
        <Heart color="#E9A9A1" className="absolute -right-3 top-2 h-8 w-auto" delay={0.9} />
        <Emphasis className="absolute -left-5 top-1/3 h-10 w-auto" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="font-eyebrow mb-1 mt-4 text-[11px] uppercase text-[#2F3D35]/60"
      >
        The Wedding Of
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.9 }}
        className="font-script text-6xl font-bold leading-tight sm:text-7xl"
      >
        {settings.bride_name || "Bride"} &amp; {settings.groom_name || "Groom"}
      </motion.h1>

      {(settings.bride_parents || settings.groom_parents) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-3 grid w-full max-w-sm gap-2 font-body text-xs leading-relaxed text-[#2F3D35]/75 sm:grid-cols-2 sm:gap-4"
        >
          {settings.bride_parents && (
            <p>
              <span className="font-heading text-sm text-[#2F3D35]">{settings.bride_name}</span>
              <br />
              {settings.bride_parents}
            </p>
          )}
          {settings.groom_parents && (
            <p>
              <span className="font-heading text-sm text-[#2F3D35]">{settings.groom_name}</span>
              <br />
              {settings.groom_parents}
            </p>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-6 w-full max-w-xs"
      >
        {blocked && (
          <div
            role="alert"
            className="wc crayon-box relative mb-6 rounded-[14px] px-6 py-4"
            style={{ backgroundColor: "#FBEFC9", boxShadow: "4px 4px 0 0 #E6D08F" }}
          >
            <p className="flex items-center justify-center gap-1.5 font-heading text-xl leading-tight">
              <Lock className="h-4 w-4 flex-none" strokeWidth={2.4} />
              {BLOCKED_TEXT[blocked].title}
            </p>
            <p className="mt-1.5 font-script text-lg leading-snug text-[#2F3D35]/80">{BLOCKED_TEXT[blocked].body}</p>
            {blocked === "error" && (
              <button
                onClick={() => window.location.reload()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full crayon-pill bg-white/80 px-4 py-1.5 font-code text-[11px] transition-transform hover:-translate-y-0.5"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Coba lagi
              </button>
            )}
          </div>
        )}

        {!blocked && guestName && (
          <div
            className="wc crayon-box relative mb-6 rounded-[14px] px-6 py-4"
            style={{ backgroundColor: "#F3DDD8", boxShadow: "4px 4px 0 0 #C3D0AE" }}
          >
            <p className="font-eyebrow text-[9px] uppercase text-[#2F3D35]/60">
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p className="mt-1.5 font-heading text-2xl">{guestName}</p>
          </div>
        )}

        {/* a stitched ribbon of a button with an envelope badge; it sinks into its edge when pressed */}
        <motion.button
          onClick={onOpen}
          disabled={!!blocked}
          whileHover={blocked ? undefined : { y: -2 }}
          whileTap={blocked ? undefined : { y: 4 }}
          className="group relative inline-flex items-center gap-3 rounded-full bg-[#3F6B57] py-2 pl-2 pr-7 text-left text-[#F6FAF2] shadow-[0_5px_0_0_#2A4A3C,0_12px_20px_-8px_rgba(42,74,60,0.6)] transition-shadow active:shadow-[0_1px_0_0_#2A4A3C,0_4px_10px_-6px_rgba(42,74,60,0.5)] disabled:cursor-not-allowed disabled:bg-[#8FA597] disabled:shadow-[0_4px_0_0_#6F8577]"
        >
          {/* stitching just inside the edge */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[4px] rounded-full border-[1.5px] border-dashed border-[#F6FAF2]/45"
          />

          {/* a soft shine sweeping across now and then */}
          {!blocked && (
            <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <motion.span
                className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                initial={{ x: "-150%" }}
                animate={{ x: ["-150%", "400%"] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut", delay: 1.2 }}
              />
            </span>
          )}

          {/* the envelope badge, sealed with a little heart */}
          <motion.span
            className="relative grid h-11 w-11 flex-none place-items-center rounded-full bg-[#F6FAF2] text-[#3F6B57] shadow-[inset_0_-2px_0_0_#D9E6CC]"
            animate={blocked ? undefined : { rotate: [0, -10, 8, -4, 0] }}
            transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 3.3, delay: 1.6 }}
          >
            {blocked ? (
              <Lock className="h-5 w-5" strokeWidth={2.2} />
            ) : (
              <>
                <Mail className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" strokeWidth={2.2} />
                <span className="absolute -right-0.5 -top-0.5">
                  <Heart color="#E9A9A1" animate={false} className="h-3.5 w-auto text-[#2F3D35]" />
                </span>
              </>
            )}
          </motion.span>

          <span className="relative flex flex-col leading-none">
            <span className="font-poster text-base sm:text-lg">Buka Undangan</span>
            <span className="font-eyebrow mt-1 text-[9px] text-[#F6FAF2]/70">
              {blocked ? "perlu link pribadi" : "ketuk untuk membuka"}
            </span>
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
