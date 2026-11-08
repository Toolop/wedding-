"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Lock, MailOpen, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import type { Settings } from "@/lib/types";
import { FlowerFrame } from "./Flowers";
import { useInvitedGuest } from "./guest";
import { Emphasis, Heart, Illustration, WashBackdrop } from "./WatercolorArt";

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
  onTap,
}: {
  settings: Settings;
  /** why this visit can't open the invitation, or null when it can */
  blocked: keyof typeof BLOCKED_TEXT | null;
  /** called once the opening animation has played */
  onOpen: () => void;
  /** called right on the tap, while the browser still counts it as a gesture (for sound) */
  onTap?: () => void;
}) {
  const guestName = useInvitedGuest()?.name;
  const reduce = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  /** set on tap: the button's centre, where the reveal circle grows from */
  const [opening, setOpening] = useState<{ x: number; y: number } | null>(null);
  const open = () => {
    if (blocked || opening) return;
    onTap?.();
    if (reduce) return onOpen();
    const r = buttonRef.current?.getBoundingClientRect();
    setOpening(
      r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    );
    // the card lifts away (0.15-0.8s) while the circle sweeps the screen from the button (0.3-1.05s)
    setTimeout(onOpen, 1050);
  };
  const date = new Date(settings.wedding_date);
  const dateLine = Number.isNaN(date.getTime())
    ? ""
    : [date.getDate(), date.getMonth() + 1, date.getFullYear() % 100].map((n) => String(n).padStart(2, "0")).join(" · ");
  const bride = settings.bride_name || "Bride";
  const groom = settings.groom_name || "Groom";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overflow-x-hidden bg-[#F2F6EF] px-5 py-6 text-center text-[#2F3D35] [justify-content:safe_center]"
    >
      <WashBackdrop />
      <FlowerFrame />

      {/* Everything sits on one white invitation card, so no line of text lies straight on the
          busy wash: the couple's medallion rides its top edge, the guest's name sits below
          the couple's, and the open button fills its foot. */}
      <div className="relative z-10 flex w-full max-w-[340px] flex-col items-center">
        {/* medallion: the couple waving hello, with a heart and sparkle marks like the art */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={opening ? { opacity: 0, y: -40, scale: 1.3 } : { opacity: 1, y: 0, scale: 1 }}
          transition={opening ? { delay: 0.15, duration: 0.6, ease: "easeIn" } : { delay: 0.15, duration: 0.8, ease: "backOut" }}
          className="relative z-10"
        >
          <span className="block rounded-full bg-white p-1.5 shadow-[0_10px_24px_-10px_rgba(47,74,62,0.55)] ring-2 ring-[#2F3D35]/70">
            <span className="block h-[20vh] max-h-44 w-[20vh] max-w-44 overflow-hidden rounded-full border border-dashed border-[#2F3D35]/25 [@media(max-height:700px)]:h-[15vh] [@media(max-height:700px)]:w-[15vh]">
              <Illustration name="hello" className="h-full w-full scale-110 object-cover object-[50%_40%]" />
            </span>
          </span>
          <Heart color="#E9A9A1" className="absolute -right-3 top-0 h-8 w-auto drop-shadow-[1px_2px_0_rgba(47,61,53,0.2)]" delay={0.9} />
          <Emphasis className="absolute -left-7 top-1/3 h-9 w-auto" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={opening ? { opacity: 0, y: 70, scale: 0.9 } : { opacity: 1, y: 0, scale: 1 }}
          transition={opening ? { delay: 0.2, duration: 0.6, ease: "easeIn" } : { delay: 0.3, type: "spring", stiffness: 120, damping: 18 }}
          // pulled up under the medallion by half its height
          className="relative -mt-[min(10vh,5.5rem)] w-full rounded-[28px] bg-white shadow-[0_22px_44px_-22px_rgba(47,74,62,0.55)] ring-1 ring-[#3F6B57]/15 [@media(max-height:700px)]:-mt-[7.5vh]"
        >
          <span aria-hidden className="pointer-events-none absolute inset-2 rounded-[22px] border border-dashed border-[#3F6B57]/25" />

          {/* top: who is getting married, and whose children they are */}
          <div className="relative px-6 pb-4 pt-[calc(min(10vh,5.5rem)+14px)] [@media(max-height:700px)]:pt-[calc(7.5vh+12px)]">
            <p className="font-eyebrow flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[#3F6B57]">
              <span aria-hidden className="h-px w-6 bg-current opacity-40" />
              The Wedding Of
              <span aria-hidden className="h-px w-6 bg-current opacity-40" />
            </p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.8 }}
              className="font-script mt-1 text-[2.9rem] font-bold leading-[1.05] [@media(min-height:760px)]:text-[3.3rem]"
            >
              {bride} <span className="text-[#C2676A]">&amp;</span> {groom}
            </motion.h1>
            {dateLine && <p className="font-code mt-1 text-xs tracking-[0.3em] text-[#2F3D35]/70">{dateLine}</p>}

            {(settings.bride_parents || settings.groom_parents) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[16px] bg-[#F4F8F1] px-3 py-3 font-body text-[13px] leading-snug text-[#2F3D35]/80"
              >
                <p>
                  <span className="font-heading mb-0.5 block text-[19px] leading-tight text-[#2F3D35]">{bride}</span>
                  {settings.bride_parents}
                </p>
                <span aria-hidden className="font-script text-2xl leading-none text-[#C2676A]">
                  &amp;
                </span>
                <p>
                  <span className="font-heading mb-0.5 block text-[19px] leading-tight text-[#2F3D35]">{groom}</span>
                  {settings.groom_parents}
                </p>
              </motion.div>
            )}
          </div>


          {/* stub: who this copy is for (or why it can't open), with room for the button's overlap */}
          <div className="relative px-6 pb-4 pt-2">
            {blocked ? (
              <div role="alert" className="rounded-[14px] bg-[#FBEFC9] px-4 py-3">
                <p className="flex items-center justify-center gap-1.5 font-heading text-lg leading-tight">
                  <Lock className="h-4 w-4 flex-none" strokeWidth={2.4} />
                  {BLOCKED_TEXT[blocked].title}
                </p>
                <p className="mt-1 font-script text-lg leading-snug text-[#2F3D35]/80">{BLOCKED_TEXT[blocked].body}</p>
                {blocked === "error" && (
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full crayon-pill bg-white/80 px-4 py-1.5 font-code text-[11px] transition-transform hover:-translate-y-0.5"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Coba lagi
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="font-eyebrow text-[10px] uppercase text-[#3F6B57]">Kepada Yth.</p>
                <p className="font-body text-xs text-[#2F3D35]/65">Bapak/Ibu/Saudara/i</p>
                <p className="font-script mt-0.5 break-words text-[2.1rem] leading-[1.05] text-[#2F3D35] [@media(min-height:760px)]:text-[2.4rem]">
                  {guestName || "Tamu Undangan"}
                </p>
              </>
            )}
          </div>

          {/* the open button, in the card's foot: a calm, solid pill with a hairline inside its
              edge and a soft sheen that crosses it on hover */}
          <div className="relative px-4 pb-4">
            <motion.button
              ref={buttonRef}
              onClick={open}
              disabled={!!blocked}
              whileTap={blocked ? undefined : { scale: 0.97 }}
              className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-[#3F6B57] py-3.5 text-[#F6FAF2] shadow-[0_12px_22px_-12px_rgba(42,74,60,0.9)] transition-colors hover:bg-[#365E4C] disabled:cursor-not-allowed disabled:bg-[#A3B4A9] disabled:shadow-none"
            >
              <span aria-hidden className="pointer-events-none absolute inset-[3px] rounded-full border border-white/25" />
              {!blocked && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[420%]"
                />
              )}
              {blocked ? <Lock className="relative h-4 w-4" strokeWidth={2.2} /> : <MailOpen className="relative h-4 w-4" strokeWidth={2.2} />}
              <span className="font-eyebrow relative text-[12px] uppercase tracking-[0.24em]">
                {blocked ? "Perlu link pribadi" : "Buka Undangan"}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {opening && (
        <>
          {/* paper sweeping over the screen from the button; the invitation appears behind it */}
          <motion.div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[65] bg-[#F4F8F1]"
            initial={{ clipPath: `circle(0px at ${opening.x}px ${opening.y}px)` }}
            animate={{ clipPath: `circle(150vmax at ${opening.x}px ${opening.y}px)` }}
            transition={{ delay: 0.3, duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
          />
        </>
      )}
    </motion.div>
  );
}
