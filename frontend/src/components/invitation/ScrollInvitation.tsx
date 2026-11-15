"use client";

import { MotionConfig, motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, CalendarHeart, Instagram, Pause, Play } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import type { InvitationData, Settings } from "@/lib/types";
import { useInvitedGuest } from "./guest";
import { colors } from "./theme";
import { type IllustrationKey } from "./assets";
import { Illustration } from "./WatercolorArt";
import { BotanicalFrame, DoubleFrame, Eyebrow, Monogram, Ornament, PhotoCorners } from "./classy";
import { CountdownClassic } from "./Countdown";
import { formatLongDate, splitTime } from "./PortalPanels";
import { CeremonyPanel } from "./CeremonyPanel";
import { GalleryPanel } from "./GalleryPanel";
import { GiftPanel } from "./GiftPanel";
import { RsvpPanel } from "./RsvpPanel";
import { calendarUrl } from "./Hero";

/**
 * The invitation as one long page, like a classic digital invitation booklet.
 * Desktop: a still illustration on the left, the booklet scrolling on the right.
 * Phone: just the booklet. The heavier sections reuse the dashboard's panels.
 */

const MINT = colors.mistSoft;
const DEEP = colors.brand;

type Band = "paper" | "mint" | "deep";
const BAND_BG: Record<Band, string> = { paper: colors.page, mint: MINT, deep: DEEP };

/* ------------------------------------------------------------- utilities */
function weddingDate(settings: Settings) {
  const d = new Date(settings.wedding_date);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dotDate(settings: Settings) {
  const d = weddingDate(settings);
  if (!d) return settings.wedding_date;
  return [d.getDate(), d.getMonth() + 1, d.getFullYear() % 100].map((n) => String(n).padStart(2, "0")).join(" · ");
}

/* ------------------------------------------------------------ animation */
const EASE = [0.22, 1, 0.36, 1] as const;

type From = "up" | "left" | "right" | "zoom" | "fade";
const HIDDEN: Record<From, Record<string, number>> = {
  up: { opacity: 0, y: 40 },
  left: { opacity: 0, x: -60},
  right: { opacity: 0, x: 60},
  zoom: { opacity: 0, scale: 0.85 },
  fade: { opacity: 0 },
};

/** enters once it scrolls into view. Transforms are safe around the panels:
 *  their lightbox, map viewer and photo preview are all portalled out of the page. */
function FadeIn({
  children,
  from = "up",
  delay = 0,
  amount = 0.3,
  className = "",
}: {
  children: ReactNode;
  from?: From;
  delay?: number;
  amount?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={HIDDEN[from]}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1}}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** thin bar along the top that fills as the guest reads down the page */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <motion.div
      aria-hidden
      className="fixed left-0 right-0 top-0 z-[56] h-1 origin-left lg:left-auto lg:w-[480px]"
      style={{ scaleX, background: colors.gold }}
    />
  );
}

/** where one band ends and the next begins: a hairline with a small gold ornament on the seam */
function Tear({ from, to }: { from: Band; to: Band; flip?: boolean }) {
  return (
    <div aria-hidden className="relative z-[1] h-px" style={{ backgroundColor: from === "deep" || to === "deep" ? colors.honey : colors.line }}>
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1"
        style={{ background: `linear-gradient(${BAND_BG[from]} 50%, ${BAND_BG[to]} 50%)` }}
      >
        <Ornament onBrand={from === "deep" || to === "deep"} />
      </span>
    </div>
  );
}

/** a section's title, set to one side: its number in a fine gold ring, the title rising
 *  out of its line, and a short gold rule drawn underneath. */
function Heading({
  no,
  eyebrow,
  title,
  dark = false,
  align = "left",
}: {
  no: string;
  eyebrow: string;
  title: string;
  dark?: boolean;
  align?: "left" | "right";
}) {
  const fg = dark ? "var(--color-on-brand)" : colors.ink;
  const right = align === "right";
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      transition={{ staggerChildren: 0.12 }}
      className={`mb-9 flex items-end gap-4 ${right ? "flex-row-reverse text-right" : ""}`}
    >
      <motion.span
        variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
        transition={{ duration: 0.6, ease: EASE }}
        className="grid h-14 w-14 flex-none place-items-center rounded-full border border-gold font-serif text-2xl italic leading-none"
        style={{ color: dark ? colors.honey : colors.brand }}
      >
        {no}
      </motion.span>
      <span className="min-w-0 pb-0.5">
        <motion.span
          variants={{ hidden: { opacity: 0, x: right ? 14 : -14 }, show: { opacity: 1, x: 0 } }}
          transition={{ duration: 0.6, ease: EASE }}
          className={`font-eyebrow block text-[11px] uppercase tracking-[0.3em] ${dark ? "text-honey" : "text-gold-ink"}`}
        >
          {eyebrow}
        </motion.span>
        <span className="relative mt-0.5 inline-block">
          <span className="relative block overflow-hidden py-1">
            <motion.h2
              variants={{ hidden: { y: "110%" }, show: { y: 0 } }}
              transition={{ duration: 0.8, ease: EASE }}
              className="font-serif text-[2.75rem] font-medium leading-[1.05]"
              style={{ color: fg }}
            >
              {title}
            </motion.h2>
          </span>
          <motion.span
            aria-hidden
            variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
            className={`mt-1 block h-px w-10 bg-gold ${right ? "ml-auto origin-right" : "origin-left"}`}
          />
        </span>
      </span>
    </motion.div>
  );
}

function Section({
  id,
  band,
  children,
  className = "",
}: {
  id: string;
  band: Band;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative scroll-mt-4 px-6 py-14 ${className}`}
      style={{ backgroundColor: BAND_BG[band], color: band === "deep" ? "var(--color-on-brand)" : colors.ink }}
    >
      {children}
    </section>
  );
}

/** a photo (or one of the couple's illustrations) as a print with gold corner mounts. It
 *  settles onto the page when it scrolls in and drifts a few pixels with the scroll. */
function Polaroid({
  src,
  fallback,
  alt = "",
  caption,
  className = "",
}: {
  src?: string;
  fallback: IllustrationKey;
  alt?: string;
  caption?: string;
  tilt?: number;
  tape?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [14, -14]);
  return (
    <motion.div ref={ref} style={{ y }} className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <PhotoCorners className="block w-full !p-2">
          <span className="block aspect-[4/5] w-full overflow-hidden bg-chrome">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(src)} alt={alt} draggable={false} className="h-full w-full object-cover" />
            ) : (
              <Illustration name={fallback} className="h-full w-full object-cover" />
            )}
          </span>
          {caption && (
            <span className="block px-1 pb-1 pt-2 text-center font-script text-lg leading-none text-ink/80">{caption}</span>
          )}
        </PhotoCorners>
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------------------------------------- sections */
/** the arch the cover picture sits in, as a path: straight sides, a half-circle on top */
const ARCH = "M1 249 V100 A99 99 0 0 1 199 100 V249 Z";

function Cover({ settings }: { settings: Settings }) {
  const guest = useInvitedGuest()?.name;
  const groom = settings.groom_name || "Groom";
  const bride = settings.bride_name || "Bride";
  // as the guest scrolls away the picture lags a little behind the page, the names ease
  // apart, and the whole cover dims, so the next band seems to be laid over it
  const { scrollY } = useScroll();
  const photoY = useTransform(scrollY, [0, 700], [0, 70]);
  const photoScale = useTransform(scrollY, [0, 700], [1, 1.08]);
  const groomX = useTransform(scrollY, [0, 600], [0, -28]);
  const brideX = useTransform(scrollY, [0, 600], [0, 28]);
  const fade = useTransform(scrollY, [0, 600], [1, 0.15]);
  /** a slow, even settle: nothing bounces on this page */
  const settle = (delay: number, duration = 1.1) => ({ delay, duration, ease: EASE });
  return (
    <section
      id="cover"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-14 text-center"
      style={{ backgroundColor: colors.page, color: colors.ink }}
    >
      <BotanicalFrame />
      {/* a fine line just inside the page edge, like the border of a printed card */}
      <motion.span
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={settle(0.1, 1.6)}
        className="pointer-events-none absolute inset-3 rounded-[3px] border border-gold-soft/70"
      />

      <motion.div style={{ opacity: fade }} className="relative flex w-full flex-col items-center">
        {/* the heading drifts in from wide letter-spacing, between two rules that grow outward */}
        <div className="flex w-full max-w-[17rem] items-center gap-3">
          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={settle(0.5, 1.2)}
            className="h-px flex-1 origin-right bg-gold"
          />
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.7em" }}
            animate={{ opacity: 1, letterSpacing: "0.35em" }}
            transition={settle(0.2, 1.6)}
            className="font-eyebrow whitespace-nowrap text-[11px] uppercase text-gold-ink"
          >
            The wedding of
          </motion.p>
          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={settle(0.5, 1.2)}
            className="h-px flex-1 origin-left bg-gold"
          />
        </div>

        {/* the picture: its gold arch is drawn first, then the picture rises into it like a
            curtain lifting, still easing closer for a moment after */}
        <motion.div style={{ y: photoY }} className="relative mt-8 aspect-[4/5] w-[min(62vw,15.5rem)]">
          <svg aria-hidden viewBox="0 0 200 250" preserveAspectRatio="none" fill="none" className="absolute -inset-[9px] h-[calc(100%+18px)] w-[calc(100%+18px)] overflow-visible">
            <motion.path
              d={ARCH}
              stroke={colors.gold}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ pathLength: { delay: 0.4, duration: 2, ease: [0.65, 0, 0.35, 1] }, opacity: { delay: 0.4, duration: 0.3 } }}
            />
          </svg>
          <motion.div
            initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            transition={{ delay: 0.9, duration: 1.7, ease: [0.65, 0, 0.35, 1] }}
            className="h-full w-full overflow-hidden rounded-t-full bg-chrome shadow-paint-md"
          >
            <motion.div
              initial={{ scale: 1.18 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, duration: 3.2, ease: EASE }}
              className="h-full w-full"
            >
              <motion.div style={{ scale: photoScale }} className="h-full w-full">
                {settings.hero_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(settings.hero_image)} alt={`${groom} & ${bride}`} draggable={false} className="h-full w-full object-cover" />
                ) : (
                  <Illustration name="hello" className="h-full w-full object-cover" />
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* the names are written in, left to right, one after the other; off-centre on two lines */}
        <h1 aria-label={`${groom} & ${bride}`} className="mt-9 w-full max-w-[19rem] font-flourish text-[clamp(3.4rem,17vw,4.4rem)] leading-[1]">
          {[groom, bride].map((name, i) => (
            <motion.span key={i} aria-hidden style={{ x: i ? brideX : groomX }} className={`block px-1 ${i ? "-mt-1 text-right" : "text-left"}`}>
              {i === 1 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={settle(2.5, 0.9)}
                  className="mr-2 inline-block text-[0.7em] text-gold"
                >
                  &amp;
                </motion.span>
              )}
              <motion.span
                // generous negative insets so the script's swashes are never cut by the wipe
                initial={{ clipPath: "inset(-30% 110% -30% -15%)" }}
                animate={{ clipPath: "inset(-30% -15% -30% -15%)" }}
                transition={{ delay: 1.9 + i * 0.75, duration: 1.3, ease: [0.45, 0, 0.25, 1] }}
                className="inline-block"
              >
                {name}
              </motion.span>
            </motion.span>
          ))}
        </h1>

        {/* the date, between two rules that open from its centre */}
        <div className="mt-6 flex w-full max-w-[15rem] items-center gap-4">
          <motion.span aria-hidden initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={settle(3.3, 1)} className="h-px flex-1 origin-right bg-line" />
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={settle(3.3)}
            className="font-serif text-xl tracking-[0.25em] text-brand"
          >
            {dotDate(settings)}
          </motion.p>
          <motion.span aria-hidden initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={settle(3.3, 1)} className="h-px flex-1 origin-left bg-line" />
        </div>

        {guest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={settle(3.7)}
            className="mt-7 w-full max-w-[280px]"
          >
            <p className="font-eyebrow text-[10px] uppercase tracking-[0.3em] text-muted">Kepada Yth.</p>
            <p className="mt-1 font-script text-[1.7rem] font-medium leading-tight">{guest}</p>
          </motion.div>
        )}
      </motion.div>

      {/* scroll cue: a hairline with a gold bead travelling down it */}
      <motion.a
        href="#salam"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={settle(4.2)}
        className="absolute bottom-7 flex flex-col items-center gap-2 font-eyebrow text-[10px] uppercase tracking-[0.3em] text-muted"
      >
        scroll
        <span className="relative block h-9 w-px overflow-hidden bg-line">
          <motion.span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1/2 bg-gold"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.a>
    </section>
  );
}

const DEFAULT_VERSE =
  "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.";

/** one word of the verse: dim until the guest's scrolling reaches it */
function LitWord({
  progress,
  range,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  children: ReactNode;
}) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block whitespace-pre">
      {children}
    </motion.span>
  );
}

function Verse({ settings }: { settings: Settings }) {
  const quote = settings.quote || DEFAULT_VERSE;
  const author = settings.quote ? settings.quote_author : "QS Ar-Rum : 21";
  const words = quote.split(" ");
  // the verse is read by scrolling: each word lights up as the page moves past it
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.5"] });
  const authorOpacity = useTransform(scrollYProgress, [0.9, 1], [0, 0.75]);
  return (
    <Section id="salam" band="deep">
      <div ref={ref} className="mx-auto max-w-sm">
        <motion.span
          aria-hidden
          style={{ color: colors.honey }}
          className="block font-serif text-7xl leading-none"
        >
          “
        </motion.span>
        <p className="font-script -mt-5 text-[1.85rem] leading-snug">
          {words.map((word, i) => (
            <LitWord key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {word}{" "}
            </LitWord>
          ))}
        </p>
        {author && (
          <motion.p
            style={{ opacity: authorOpacity }}
            className="font-eyebrow mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-honey"
          >
            <span aria-hidden className="h-px w-8 bg-honey" />
            {author}
          </motion.p>
        )}
      </div>
    </Section>
  );
}

function Person({
  role,
  nick,
  full,
  parents,
  instagram,
  photo,
  fallback,
  side,
}: {
  role: string;
  nick: string;
  full: string;
  parents: string;
  instagram: string;
  photo: string;
  fallback: IllustrationKey;
  /** which side the print is taped on; the words come in from the other */
  side: "left" | "right";
}) {
  const right = side === "right";
  return (
    <div className={`flex items-center gap-5 ${right ? "flex-row-reverse text-right" : "text-left"}`}>
      <Polaroid
        src={photo}
        fallback={fallback}
        alt={full}
        caption={nick}
        className="w-[44%] flex-none"
      />
      <FadeIn from={right ? "left" : "right"} delay={0.2} className="min-w-0 flex-1">
        <p className="font-eyebrow text-[11px] uppercase tracking-[0.25em] text-gold-ink">{role}</p>
        <h3 className="mt-1 font-serif text-[1.7rem] font-semibold leading-[1.1]">{nick && <span className="mb-0.5 block font-flourish text-[2.3rem] font-normal leading-none text-brand">{nick}</span>}{full}</h3>
        {parents && <p className="font-body mt-2 text-[13px] leading-relaxed opacity-75">{parents}</p>}
        {instagram && (
          <a
            href={`https://instagram.com/${instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-4 font-code text-xs text-ink transition-colors hover:border-gold"
          >
            <Instagram className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} /> {instagram.replace("@", "")}
          </a>
        )}
      </FadeIn>
    </div>
  );
}

function Couple({ settings }: { settings: Settings }) {
  return (
    <Section id="mempelai" band="paper">
      <Heading no="01" eyebrow="bride & groom" title="Mempelai" />
      <FadeIn>
        <p className="font-body mb-10 max-w-sm text-sm leading-relaxed opacity-80">
          Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu, Saudara/i untuk
          menghadiri acara pernikahan kami.
        </p>
      </FadeIn>
      <Person
        role="Mempelai Pria"
        nick={settings.groom_name}
        full={settings.groom_full_name || settings.groom_name}
        parents={settings.groom_parents}
        instagram={settings.groom_instagram}
        photo={settings.groom_photo}
        fallback="cafe"
        side="left"
      />
      {/* the "&" settles in between the two prints */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.8 }}
        className="my-3 text-center font-flourish text-7xl leading-none text-gold"
      >
        &amp;
      </motion.div>
      <Person
        role="Mempelai Wanita"
        nick={settings.bride_name}
        full={settings.bride_full_name || settings.bride_name}
        parents={settings.bride_parents}
        instagram={settings.bride_instagram}
        photo={settings.bride_photo}
        fallback="dinner"
        side="right"
      />
    </Section>
  );
}

const WEEK_LETTERS = ["S", "S", "R", "K", "J", "S", "M"];
const rise = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

/** the date set like the centre of a printed invitation: month | day | year, the week it
 *  falls in underneath with the day ringed, and the countdown at the foot of the same card */
function DateCard({ date, settings }: { date: Date; settings: Settings }) {
  const day = date.getDate();
  const monday = new Date(date);
  monday.setDate(day - ((date.getDay() + 6) % 7)); // weeks start on Monday
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const time = splitTime(settings.akad_time || settings.resepsi_time || "");
  const side = "border-y border-gold-soft py-2 font-eyebrow text-[11px] uppercase tracking-[0.3em] text-ink";
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35 }}
      transition={{ staggerChildren: 0.14, delayChildren: 0.1 }}
      className="mx-auto w-full max-w-[360px]"
    >
      <DoubleFrame innerClassName="px-4 pb-6 pt-7 text-ink sm:px-6">
        <motion.p variants={rise} transition={{ duration: 0.8, ease: EASE }} className="font-eyebrow text-[11px] uppercase tracking-[0.35em] text-gold-ink">
          {new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date)}
        </motion.p>

        {/* month | day | year: the number rises out of its line, the sides slide in toward it */}
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <motion.span
            variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.9, ease: EASE }}
            className={side}
          >
            {new Intl.DateTimeFormat("id-ID", { month: "long" }).format(date)}
          </motion.span>
          <span className="block overflow-hidden px-1">
            <motion.span
              variants={{ hidden: { y: "105%" }, show: { y: 0 } }}
              transition={{ duration: 1.1, ease: EASE }}
              className="block font-serif text-[5.75rem] font-medium leading-[0.95] text-brand"
            >
              {String(day).padStart(2, "0")}
            </motion.span>
          </span>
          <motion.span
            variants={{ hidden: { opacity: 0, x: 14 }, show: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.9, ease: EASE }}
            className={side}
          >
            {date.getFullYear()}
          </motion.span>
        </div>

        {time.start && (
          <motion.p variants={rise} transition={{ duration: 0.8, ease: EASE }} className="mt-2 font-script text-xl text-muted">
            pukul {time.start} {time.zone}
          </motion.p>
        )}

        <motion.div variants={{ hidden: { opacity: 0, scaleX: 0.4 }, show: { opacity: 1, scaleX: 1 } }} transition={{ duration: 0.9, ease: EASE }}>
          <Ornament className="my-5 [&>span:first-child]:w-12 [&>span:last-child]:w-12" />
        </motion.div>

        {/* the week of the wedding; a gold ring is drawn around the day */}
        <motion.div variants={rise} transition={{ duration: 0.8, ease: EASE }} className="grid grid-cols-7 text-center">
          {week.map((d, i) => {
            const hit = d.getDate() === day && d.getMonth() === date.getMonth();
            return (
              <span key={i} className="flex flex-col items-center gap-1.5">
                <span className={`font-eyebrow text-[10px] ${hit ? "text-gold-ink" : "text-muted"}`}>{WEEK_LETTERS[i]}</span>
                <span
                  className={`relative grid h-9 w-9 place-items-center rounded-full font-serif text-lg leading-none ${
                    hit ? "bg-brand font-semibold text-paper" : d.getMonth() === date.getMonth() ? "" : "text-stone"
                  }`}
                >
                  {d.getDate()}
                  {hit && (
                    <svg aria-hidden viewBox="0 0 48 48" fill="none" className="absolute -inset-[6px] h-[calc(100%+12px)] w-[calc(100%+12px)] -rotate-90">
                      <motion.circle
                        cx="24"
                        cy="24"
                        r="23"
                        stroke={colors.gold}
                        strokeWidth={1}
                        variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1 } }}
                        transition={{ delay: 0.9, duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
                      />
                    </svg>
                  )}
                </span>
              </span>
            );
          })}
        </motion.div>

        <motion.div variants={rise} transition={{ duration: 0.8, ease: EASE }} className="mt-6 border-t border-line-soft pt-5">
          <p className="font-eyebrow mb-3 text-[10px] uppercase tracking-[0.3em] text-gold-ink">Menuju hari bahagia</p>
          <CountdownClassic target={settings.wedding_date} light />
        </motion.div>
      </DoubleFrame>
    </motion.div>
  );
}

function SaveTheDate({ settings }: { settings: Settings }) {
  const d = weddingDate(settings);
  const gcal = calendarUrl(settings);
  return (
    <Section id="tanggal" band="mint" className="text-center">
      <Heading no="02" eyebrow="save the date" title="Hari Bahagia" align="right" />
      {d && <DateCard date={d} settings={settings} />}
      <FadeIn delay={0.2}>
        <p className="font-script mx-auto mt-8 max-w-xs text-2xl leading-snug text-muted">
          Satu hari yang kami tunggu sejak lama, dan kami ingin Anda ada di dalamnya.
        </p>
      </FadeIn>
      {gcal && (
        <FadeIn delay={0.3}>
          <a
            href={gcal}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold bg-paper px-6 font-code text-[13px] text-ink transition-colors hover:bg-chrome"
          >
            <CalendarHeart className="h-4 w-4 text-brand" strokeWidth={1.5} /> Simpan ke kalender
          </a>
        </FadeIn>
      )}
    </Section>
  );
}

/** a section whose body is one of the dashboard's panels */
function PanelSection({
  id,
  band,
  no,
  eyebrow,
  title,
  align,
  children,
}: {
  id: string;
  band: Band;
  no: string;
  eyebrow: string;
  title: string;
  align?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <Section id={id} band={band}>
      <Heading no={no} eyebrow={eyebrow} title={title} align={align} />
      <FadeIn amount={0.08}>{children}</FadeIn>
    </Section>
  );
}

function Closing({ settings }: { settings: Settings }) {
  const date = formatLongDate(settings.wedding_date);
  return (
    <Section id="penutup" band="deep" className="pb-28 text-center lg:pb-16">
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <Monogram a="R" b="T" size={112} className="rounded-full bg-page p-2" />
        <FadeIn delay={0.2}>
          <p className="font-body mt-8 text-sm leading-relaxed opacity-85">
            Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan
            memberikan doa restu kepada kami.
          </p>
        </FadeIn>
        <FadeIn delay={0.35}>
          <p className="font-script mt-5 text-3xl" style={{ color: colors.honey }}>
            Kami yang berbahagia,
          </p>
        </FadeIn>
        <FadeIn from="zoom" delay={0.5}>
          <p className="mt-1 flex items-center justify-center gap-3 font-flourish text-5xl leading-tight">
            {settings.groom_name}
            <span className="text-[0.8em] text-honey">&amp;</span>
            {settings.bride_name}
          </p>
        </FadeIn>
        {date && (
          <FadeIn from="fade" delay={0.7}>
            <p className="font-eyebrow mt-3 text-[11px] uppercase tracking-[0.3em] text-honey">{date}</p>
          </FadeIn>
        )}
        <Ornament onBrand className="mt-6" />
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- nav + art */
/**
 * The page reads itself: a slow, steady scroll that starts once the cover has played.
 * Any touch, wheel or key from the guest takes over at once; it picks up again after a few
 * quiet seconds, unless they are typing (the RSVP form) or paused it with the button,
 * and it stops for good at the end. Guests who asked for reduced motion start paused.
 */
const AUTO_SPEED = 42; // px per second: unhurried, but the cover is gone in ~20s
const AUTO_START_MS = 2600;
const AUTO_RESUME_MS = 5000;

function AutoScroll() {
  // "manual": the guest pressed pause (or asked for reduced motion: they start paused).
  // "idle": a touch or wheel paused it for a moment
  const [state, setState] = useState<"waiting" | "running" | "idle" | "manual" | "done">(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "manual" : "waiting"
  );
  const running = state === "running";

  // first start, after the cover's entrance
  useEffect(() => {
    const t = setTimeout(() => setState((s) => (s === "waiting" ? "running" : s)), AUTO_START_MS);
    return () => clearTimeout(t);
  }, []);

  // the scroll itself. Track a float position: scrollBy rounds, which would stall at slow speeds.
  // behavior "instant" overrides the page's smooth scrolling, which would fight every frame.
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    let pos = window.scrollY;
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // the guest (or a section link) moved the page: carry on from there
      if (Math.abs(window.scrollY - pos) > 2) pos = window.scrollY;
      pos += AUTO_SPEED * dt;
      const end = document.documentElement.scrollHeight - window.innerHeight;
      if (pos >= end - 1) {
        window.scrollTo({ top: end, behavior: "instant" });
        setState("done");
        return;
      }
      window.scrollTo({ top: pos, behavior: "instant" });
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  // the guest takes over: pause now, resume after a quiet spell. Registered once, reading
  // the state through a ref: re-subscribing on every state change would clear the resume timer.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const typing = () => {
      const el = document.activeElement;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT");
    };
    const resume = () => {
      if (stateRef.current !== "idle") return;
      if (typing()) timer = setTimeout(resume, AUTO_RESUME_MS);
      else setState("running");
    };
    const takeOver = (e: Event) => {
      // presses on the pause button are handled by the button
      if (e.target instanceof Element && e.target.closest("[data-autoscroll]")) return;
      const now = stateRef.current;
      if (now !== "running" && now !== "idle") return;
      setState("idle");
      clearTimeout(timer);
      timer = setTimeout(resume, AUTO_RESUME_MS);
    };
    const opts = { passive: true } as const;
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    events.forEach((ev) => window.addEventListener(ev, takeOver, opts));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, takeOver));
      clearTimeout(timer);
    };
  }, []);

  if (state === "waiting") return null;
  const playing = state === "running" || state === "idle";
  return (
    <motion.button
      type="button"
      data-autoscroll
      onClick={() => {
        if (state === "done") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => setState("running"), 900);
        } else setState(playing ? "manual" : "running");
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      aria-label={state === "done" ? "Kembali ke atas" : playing ? "Hentikan scroll otomatis" : "Scroll otomatis"}
      aria-pressed={playing}
      // phones: bottom-right (music is top-left, the mode switch top-right);
      // desktop: above the music button in the bottom-right corner
      className="fixed bottom-4 right-3 z-[55] flex h-11 items-center gap-1.5 rounded-full bg-brand-ink pl-3 pr-3.5 font-eyebrow text-[9px] uppercase tracking-[0.12em] text-on-brand shadow-[0_6px_18px_color-mix(in_srgb,var(--color-brand-ink)_35%,transparent)] sm:bottom-20 sm:right-4"
    >
      <span className="relative grid h-6 w-6 place-items-center rounded-full bg-on-brand text-brand-ink">
        {state === "running" && <span className="absolute inset-0 animate-ping rounded-full bg-on-brand/40" />}
        {state === "done" ? (
          <ArrowUp className="relative h-3.5 w-3.5" />
        ) : playing ? (
          <Pause className="relative h-3 w-3" fill="currentColor" />
        ) : (
          <Play className="relative ml-0.5 h-3 w-3" fill="currentColor" />
        )}
      </span>
      {state === "done" ? "Ke atas" : playing ? "Auto" : "Auto scroll"}
    </motion.button>
  );
}

/** desktop only: the opening card (the "Buka Undangan" screen) stays beside the booklet,
 *  so opening the envelope feels like the card sliding over rather than a new page */
function SidePanel({ settings }: { settings: Settings }) {
  const guest = useInvitedGuest()?.name;
  const bride = settings.bride_name || "Bride";
  const groom = settings.groom_name || "Groom";
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[calc(100%-480px)] flex-col items-center justify-center overflow-hidden bg-page px-10 text-center text-ink lg:flex">
      <BotanicalFrame />
      <Monogram a="R" b="T" size={84} className="absolute left-10 top-8" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.8, ease: EASE }}
        className="relative"
      >
        <span className="block rounded-full border border-gold bg-page p-1.5 shadow-paint-md">
          <span className="block rounded-full border border-gold-soft bg-paper p-[3px]">
            {settings.hero_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(settings.hero_image)}
                alt={`${bride} & ${groom}`}
                draggable={false}
                className="h-[28vh] max-h-60 w-[28vh] max-w-60 rounded-full object-cover object-[50%_40%]"
              />
            ) : (
              <Illustration name="hello" className="h-[28vh] max-h-60 w-auto" />
            )}
          </span>
        </span>
      </motion.div>

      <Eyebrow className="relative mb-1 mt-5 tracking-[0.35em]">The Wedding Of</Eyebrow>
      <h1 className="relative font-flourish text-7xl leading-tight">
        {bride} <span className="text-gold">&amp;</span> {groom}
      </h1>
      <p className="relative mt-1 font-serif text-xl tracking-[0.3em] text-brand">{dotDate(settings)}</p>

      {(settings.bride_parents || settings.groom_parents) && (
        <div className="relative mt-4 grid w-full max-w-sm grid-cols-2 gap-4 font-body text-xs leading-relaxed text-muted">
          {[
            [bride, settings.bride_parents],
            [groom, settings.groom_parents],
          ].map(
            ([name, parents]) =>
              parents && (
                <p key={name}>
                  <span className="font-serif text-base font-semibold text-ink">{name}</span>
                  <br />
                  {parents}
                </p>
              )
          )}
        </div>
      )}

      {guest && (
        <DoubleFrame className="relative mt-7 w-full max-w-xs" innerClassName="px-6 py-4">
          <p className="font-eyebrow text-[10px] uppercase tracking-[0.3em] text-muted">Kepada Yth. Bapak/Ibu/Saudara/i</p>
          <p className="mt-1.5 font-script text-3xl font-medium">{guest}</p>
        </DoubleFrame>
      )}
    </aside>
  );
}

/* ------------------------------------------------------------------ page */
export default function ScrollInvitation({ data }: { data: InvitationData }) {
  const { settings, gallery, gifts } = data;

  return (
    // reducedMotion="user": guests who asked their phone for less motion get plain fades
    <MotionConfig reducedMotion="user">
    <main className="relative min-h-[100dvh] w-full" style={{ backgroundColor: DEEP }}>
      <ScrollProgress />
      <SidePanel settings={settings} />

      <div className="relative mx-auto w-full max-w-[480px] overflow-x-hidden shadow-[0_0_40px_rgba(0,0,0,0.25)] lg:mr-0">
        <Cover settings={settings} />
        <Tear from="paper" to="deep" />
        <Verse settings={settings} />
        <Tear from="deep" to="paper" flip />
        <Couple settings={settings} />
        <Tear from="paper" to="mint" />
        <SaveTheDate settings={settings} />
        <Tear from="mint" to="paper" flip />
        <PanelSection id="acara" band="paper" no="03" eyebrow={settings.akad_date || settings.akad_time || settings.akad_location ? "akad & resepsi" : "resepsi"} title="Acara">
          <CeremonyPanel settings={settings} variant="scroll" />
        </PanelSection>
        <Tear from="paper" to="mint" />
        <PanelSection id="galeri" band="mint" no="04" align="right" eyebrow="our moments" title="Galeri">
          <GalleryPanel gallery={gallery} />
        </PanelSection>
        <Tear from="mint" to="paper" flip />
        <PanelSection id="hadiah" band="paper" no="05" eyebrow="wedding gift" title="Tanda Kasih">
          <p className="font-body -mt-2 mb-6 max-w-sm text-sm leading-relaxed opacity-80">
            Doa restu Anda adalah karunia yang sangat berarti bagi kami. Bila ingin memberi tanda kasih, bisa
            melalui:
          </p>
          <GiftPanel settings={settings} gifts={gifts} />
        </PanelSection>
        <Tear from="paper" to="mint" />
        <PanelSection id="rsvp" band="mint" no="06" align="right" eyebrow="rsvp & wishes" title="Ucapan">
          <RsvpPanel />
        </PanelSection>
        <Tear from="mint" to="deep" />
        <Closing settings={settings} />
      </div>

      <AutoScroll />
    </main>
    </MotionConfig>
  );
}
