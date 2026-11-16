"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Lock, Mail, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import type { Settings } from "@/lib/types";
import { BotanicalFrame, DoubleFrame, Eyebrow, Ornament } from "./classy";
import { useInvitedGuest } from "./guest";
import { mediaUrl } from "@/lib/api";

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
      r
        ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    );
    // the card lifts away (0.15-0.8s) while the circle sweeps the screen from the button (0.3-1.05s)
    setTimeout(onOpen, 1050);
  };
  const date = new Date(settings.wedding_date);
  const dateLine = Number.isNaN(date.getTime())
    ? ""
    : [date.getDate(), date.getMonth() + 1, date.getFullYear() % 100]
        .map((n) => String(n).padStart(2, "0"))
        .join(" · ");
  const bride = settings.bride_name || "Bride";
  const groom = settings.groom_name || "Groom";
  /** the cover photo uploaded in admin (Foto sampul) */
  const cover = mediaUrl(settings.hero_image);

  const weekday = Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date).toUpperCase();
  const dotted = Number.isNaN(date.getTime())
    ? ""
    : [date.getDate(), date.getMonth() + 1, date.getFullYear()]
        .map((n) => String(n).padStart(2, "0"))
        .join(".");
  const time = (settings.akad_time || settings.resepsi_time || "").split(/\s*[-–]\s*/)[0].trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{ "--m": "clamp(5.5rem, 16dvh, 11rem)" } as React.CSSProperties}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-page px-4 py-3 text-center text-ink [@media(max-height:520px)]:[--m:0px]"
    >
      <BotanicalFrame />

      {/* desktop: quiet side accents and the monogram, like the printed card's margins */}
      <div aria-hidden className="absolute left-[150px] top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3.5 lg:flex">
        <span className="h-[60px] w-px bg-gold-soft" />
        <span className="font-serif text-lg font-medium tracking-[0.35em] text-ink-soft [writing-mode:vertical-rl]">{dateLine.replaceAll(" · ", " · ")}</span>
        <span className="h-[60px] w-px bg-gold-soft" />
      </div>
      <div aria-hidden className="absolute right-[150px] top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3.5 lg:flex">
        <span className="h-[60px] w-px bg-gold-soft" />
        <span className="font-eyebrow text-[11px] uppercase tracking-[0.4em] text-gold-ink [writing-mode:vertical-rl]">The wedding day</span>
        <span className="h-[60px] w-px bg-gold-soft" />
      </div>

      <div className="relative z-10 flex max-h-full w-full max-w-[340px] flex-col items-center sm:max-w-[420px]">
        {/* medallion: two thin rings around the cover picture, riding the card's top edge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={opening ? { opacity: 0, y: -24 } : { opacity: 1, y: 0 }}
          transition={opening ? { delay: 0.15, duration: 0.6, ease: "easeIn" } : { delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 [@media(max-height:520px)]:hidden"
        >
          <span className="block rounded-full border border-gold bg-page p-1.5 shadow-paint-md">
            <span className="block rounded-full border border-gold-soft bg-paper p-[3px]">
              <span className="block h-[var(--m)] w-[var(--m)] overflow-hidden rounded-full">
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={`${bride} & ${groom}`}
                    draggable={false}
                    className="h-full w-full select-none object-cover object-[50%_40%]"
                  />
                )}
              </span>
            </span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={opening ? { opacity: 0, y: 40 } : { opacity: 1, y: 0 }}
          transition={opening ? { delay: 0.2, duration: 0.6, ease: "easeIn" } : { delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          // pulled up under the medallion by half its height
          className="relative -mt-[calc(var(--m)/2)] w-full min-h-0"
        >
          <DoubleFrame className="shadow-paint-lg" innerClassName="flex flex-col items-center px-5 pb-[clamp(0.6rem,2dvh,1rem)] pt-[calc(var(--m)/2+clamp(0.5rem,1.6dvh,0.9rem))] sm:px-6">
            <Eyebrow>The Wedding Of</Eyebrow>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="mt-[clamp(0.2rem,1dvh,0.5rem)] flex flex-col items-center"
            >
              <p className="font-flourish text-[clamp(2.4rem,8dvh,4.25rem)] leading-[1.05] text-ink">{bride}</p>
              {settings.bride_parents && <p className="max-w-[260px] text-[clamp(10px,1.6dvh,12px)] leading-snug text-ink-soft [@media(max-height:640px)]:hidden">{settings.bride_parents}</p>}
              <span className="my-[clamp(0.1rem,0.8dvh,0.5rem)] flex items-center gap-3.5" aria-hidden>
                <span className="h-px w-11 bg-gold" />
                <span className="font-serif text-3xl italic leading-none text-gold">&amp;</span>
                <span className="h-px w-11 bg-gold" />
              </span>
              <p className="font-flourish text-[clamp(2.4rem,8dvh,4.25rem)] leading-[1.05] text-ink">{groom}</p>
              {settings.groom_parents && <p className="max-w-[260px] text-[clamp(10px,1.6dvh,12px)] leading-snug text-ink-soft [@media(max-height:640px)]:hidden">{settings.groom_parents}</p>}
            </motion.div>

            {dotted && (
              <div className="mt-[clamp(0.5rem,2dvh,1.25rem)] flex flex-col items-center gap-1">
                <span className="font-serif text-[clamp(1.3rem,3.6dvh,1.7rem)] font-medium leading-none tracking-[0.1em] text-brand">{dotted}</span>
                <span className="font-eyebrow text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                  {weekday}
                  {time ? ` · ${time} WIB` : ""}
                </span>
              </div>
            )}

            <Ornament className="mt-[clamp(0.5rem,2dvh,1.25rem)] w-full [&>span:first-child]:flex-1 [&>span:last-child]:flex-1 [@media(max-height:560px)]:hidden" />

            {/* who this copy is for, or why it can't open */}
            <div className="mt-[clamp(0.4rem,1.6dvh,1rem)] w-full">
              {blocked ? (
                <div role="alert" className="rounded-[4px] border border-line bg-chrome px-4 py-3">
                  <p className="flex items-center justify-center gap-1.5 font-serif text-lg font-semibold leading-tight">
                    <Lock className="h-4 w-4 flex-none" strokeWidth={1.6} />
                    {BLOCKED_TEXT[blocked].title}
                  </p>
                  <p className="mt-1 font-script text-lg leading-snug text-ink-soft">{BLOCKED_TEXT[blocked].body}</p>
                  {blocked === "error" && (
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-paper px-4 font-code text-xs transition-transform hover:-translate-y-0.5"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Coba lagi
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <p className="font-eyebrow text-[10px] uppercase tracking-[0.3em] text-ink-soft">Kepada Yth.</p>
                  <p className="text-xs text-ink-soft">Bapak/Ibu/Saudara/i</p>
                  <p className="font-script mt-0.5 break-words text-[clamp(1.5rem,4.4dvh,2rem)] font-medium leading-[1.1] text-ink">
                    {guestName || "Tamu Undangan"}
                  </p>
                </>
              )}
            </div>

            {/* the open button: a framed green bar, calm and solid */}
            <div className="mt-[clamp(0.6rem,2.2dvh,1.25rem)] w-full rounded-[5px] border border-line bg-paper p-[5px]">
              <motion.button
                ref={buttonRef}
                onClick={open}
                disabled={!!blocked}
                whileTap={blocked ? undefined : { scale: 0.99 }}
                className="flex min-h-[48px] w-full items-center justify-center gap-3.5 rounded-[3px] border border-gold-soft bg-brand text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-stone"
              >
                {blocked ? (
                  <Lock className="h-5 w-5 text-honey" strokeWidth={1.4} />
                ) : (
                  <Mail className="h-5 w-5 text-honey" strokeWidth={1.4} />
                )}
                <span className="font-serif text-2xl font-medium italic leading-none">
                  {blocked ? "Perlu link pribadi" : "Buka Undangan"}
                </span>
              </motion.button>
            </div>
          </DoubleFrame>
        </motion.div>
      </div>

      {opening && (
        // paper sweeping over the screen from the button; the invitation appears behind it
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[65] bg-page"
          initial={{ clipPath: `circle(0px at ${opening.x}px ${opening.y}px)` }}
          animate={{ clipPath: `circle(150vmax at ${opening.x}px ${opening.y}px)` }}
          transition={{ delay: 0.3, duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
        />
      )}
    </motion.div>
  );
}
