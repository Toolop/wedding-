"use client";

import { MotionConfig, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUp, CalendarHeart, Instagram, Pause, Play } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import type { InvitationData, Settings } from "@/lib/types";
import { useInvitedGuest } from "./guest";
import { BLUSH, INK, NAVY, PAPER, RED, type IllustrationKey } from "./watercolor";
import { DoodleField, Emphasis, Heart, Illustration, Rings, WashBackdrop } from "./WatercolorArt";
import { Flower, FlowerFrame } from "./Flowers";
import { FlipCountdown } from "./Countdown";
import { formatLongDate } from "./PortalPanels";
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

const MINT = "#E4EEDF";
const DEEP = "#2F4A3E";

type Band = "paper" | "mint" | "deep";
const BAND_BG: Record<Band, string> = { paper: PAPER, mint: MINT, deep: DEEP };

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
  left: { opacity: 0, x: -60, rotate: -4 },
  right: { opacity: 0, x: 60, rotate: 4 },
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
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
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
      style={{ scaleX, background: `linear-gradient(90deg, ${BLUSH}, ${NAVY})` }}
    />
  );
}

/** soft wave where one colour band meets the next; it drifts sideways slowly, like water.
 *  The svg is two wave periods wide inside a box one period wide; a CSS loop slides it by
 *  half its width, which lands on an identical crest, so it repeats seamlessly on the GPU. */
const WAVE = "M0 18 Q120 2 240 18 T480 18 T720 18 T960 18 L960 36 L0 36 Z";
function Wave({ from, to, flip = false }: { from: Band; to: Band; flip?: boolean }) {
  return (
    <div
      aria-hidden
      style={{ backgroundColor: BAND_BG[from] }}
      className={`-mb-px overflow-hidden leading-[0] ${flip ? "-scale-x-100" : ""}`}
    >
      <div className="anim-drift w-[200%]" style={{ "--dur": "14s" } as CSSProperties}>
        <svg viewBox="0 0 960 36" preserveAspectRatio="none" className="h-7 w-full">
          <path d={WAVE} fill={BAND_BG[to]} />
        </svg>
      </div>
    </div>
  );
}

function Heading({ eyebrow, title, dark = false }: { eyebrow: string; title: string; dark?: boolean }) {
  return (
    // one beat at a time: sprigs grow, the label spreads out, the title comes into focus,
    // the crayon line draws itself, and the heart pops last
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      transition={{ staggerChildren: 0.14 }}
      className="mb-8 flex flex-col items-center text-center"
    >
      <span className="flex items-center gap-2" style={{ color: dark ? "#F6FAF2" : NAVY }}>
        <motion.span
          variants={{ hidden: { opacity: 0, scale: 0, rotate: -160 }, show: { opacity: 0.8, scale: 1, rotate: -70 } }}
          transition={{ type: "spring", stiffness: 160, damping: 14 }}
        >
          <Flower kind="sprig" className="h-6 w-auto" />
        </motion.span>
        <motion.span
          variants={{
            hidden: { opacity: 0, letterSpacing: "0.8em" },
            show: { opacity: 0.8, letterSpacing: "0.3em" },
          }}
          transition={{ duration: 0.9, ease: EASE }}
          className="font-eyebrow text-[10px] uppercase"
        >
          {eyebrow}
        </motion.span>
        <motion.span
          variants={{ hidden: { opacity: 0, scale: 0, rotate: 160 }, show: { opacity: 0.8, scale: 1, rotate: 70 } }}
          transition={{ type: "spring", stiffness: 160, damping: 14 }}
        >
          <Flower kind="sprig" className="h-6 w-auto -scale-x-100" />
        </motion.span>
      </span>
      <motion.h2
        variants={{
          hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
          show: { opacity: 1, y: 0, filter: "blur(0px)" },
        }}
        transition={{ duration: 0.9, ease: EASE }}
        className="font-script mt-1 text-[3.25rem] leading-[1.05]"
        style={{ color: dark ? "#F6FAF2" : INK }}
      >
        {title}
      </motion.h2>
      <svg viewBox="0 0 200 20" className="-mt-1 h-3 w-28" fill="none" aria-hidden>
        <motion.path
          d="M4 12 C24 2 40 20 60 10 C80 0 96 20 116 10 C136 0 152 20 172 10 C184 4 192 8 196 10"
          stroke={dark ? "#F6FAF2" : INK}
          strokeWidth={2.6}
          strokeLinecap="round"
          variants={{ hidden: { pathLength: 0, opacity: 0 }, show: { pathLength: 1, opacity: 1 } }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />
      </svg>
      <motion.span
        variants={{ hidden: { scale: 0 }, show: { scale: [0, 1.4, 1] } }}
        transition={{ duration: 0.5 }}
        className="mt-2"
      >
        <Heart color={BLUSH} animate={false} className="h-3.5 w-auto" />
      </motion.span>
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
      style={{ backgroundColor: BAND_BG[band], color: band === "deep" ? "#F6FAF2" : INK }}
    >
      {children}
    </section>
  );
}

/** a photo (or one of the couple's illustrations) in a tall arched window.
 *  It opens upward like a curtain when it scrolls in, while the picture settles from a slow zoom. */
function ArchFrame({
  src,
  fallback,
  className = "",
  alt = "",
}: {
  src?: string;
  fallback: IllustrationKey;
  className?: string;
  alt?: string;
}) {
  return (
    // the in-view trigger sits on an unclipped wrapper: a fully clipped element counts as
    // invisible to the browser, so it would never be told it had scrolled into view
    <motion.span
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className={`relative block ${className}`}
    >
      <motion.span
        // the -10% sides leave room for the offset shadow once fully open
        variants={{
          hidden: { clipPath: "inset(100% -10% -10% -10%)" },
          show: { clipPath: "inset(-10% -10% -10% -10%)" },
        }}
        transition={{ duration: 1.1, ease: EASE }}
        className="block h-full w-full rounded-t-full border-[3px] border-white p-1.5 shadow-[5px_7px_0_rgba(63,107,87,0.22)]"
        style={{ backgroundColor: "#FFFFFF" }}
      >
      <span className="block h-full w-full overflow-hidden rounded-t-full">
        <motion.span
          variants={{ hidden: { scale: 1.3 }, show: { scale: 1 } }}
          transition={{ duration: 1.8, ease: EASE }}
          className="block h-full w-full"
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(src)} alt={alt} className="h-full w-full object-cover" />
          ) : (
            <Illustration name={fallback} className="h-full w-full object-cover" />
          )}
        </motion.span>
      </span>
      </motion.span>
    </motion.span>
  );
}

/* --------------------------------------------------------------- sections */
function Cover({ settings }: { settings: Settings }) {
  const guest = useInvitedGuest()?.name;
  const groom = settings.groom_name || "Groom";
  const bride = settings.bride_name || "Bride";
  // parallax: as the guest scrolls away, the picture drifts down slower than the page
  // and the whole cover softly fades, so the next section seems to slide over it
  const { scrollY } = useScroll();
  const archY = useTransform(scrollY, [0, 700], [0, 120]);
  const fade = useTransform(scrollY, [0, 600], [1, 0.25]);
  const sprigY = useTransform(scrollY, [0, 700], [0, -80]);
  return (
    <section
      id="cover"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-16 text-center"
      style={{ backgroundColor: PAPER, color: INK }}
    >
      {/* sprigs sway in a breeze and rise a little faster than the page */}
      <motion.span style={{ y: sprigY }} className="pointer-events-none absolute -left-4 top-8">
        <span className="block origin-bottom-left -rotate-[19deg]">
          <span className="anim-sway block origin-bottom-left" style={{ "--dur": "5s" } as CSSProperties}>
            <Flower kind="sprig" className="h-24 w-auto opacity-80" />
          </span>
        </span>
      </motion.span>
      <motion.span style={{ y: sprigY }} className="pointer-events-none absolute -right-4 bottom-24">
        <span className="block origin-top-right rotate-[161deg]">
          <span className="anim-sway block origin-top-right" style={{ "--dur": "6s" } as CSSProperties}>
            <Flower kind="sprig" className="h-24 w-auto opacity-80" />
          </span>
        </span>
      </motion.span>
      <motion.div style={{ opacity: fade }} className="flex w-full flex-col items-center">

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="font-eyebrow text-[11px] uppercase tracking-[0.35em]"
        style={{ color: NAVY }}
      >
        The wedding of
      </motion.p>

      <motion.div style={{ y: archY }} className="relative mt-6">
        <ArchFrame fallback="hello" className="h-64 w-48 sm:h-72 sm:w-52" />
        <motion.span
          initial={{ opacity: 0, scale: 0, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1, type: "spring", stiffness: 180, damping: 12 }}
          className="absolute -bottom-3 -right-5"
        >
          <Rings className="h-12 w-auto" delay={1} />
        </motion.span>
      </motion.div>

      <h1 className="font-poster mt-7 text-5xl leading-[1.05]">
        {[groom, "&", bride].map((part, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + i * 0.14, type: "spring", stiffness: 220, damping: 18 }}
            className={i === 1 ? "font-script mx-2 inline-block text-[0.95em] font-normal" : "inline-block"}
            style={i === 1 ? { color: RED } : undefined}
          >
            {part}
          </motion.span>
        ))}
      </h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="font-code mt-3 text-sm tracking-[0.3em] opacity-80"
      >
        {dotDate(settings)}
      </motion.p>

      {guest && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.6 }}
          className="mt-7 w-full max-w-[260px] rounded-[14px] border-2 border-dashed border-[#3F6B57]/35 px-4 py-3"
          style={{ backgroundColor: MINT }}
        >
          <p className="font-eyebrow text-[9px] uppercase tracking-[0.2em] opacity-60">Kepada Yth.</p>
          <p className="font-heading mt-0.5 text-xl leading-tight">{guest}</p>
        </motion.div>
      )}
      </motion.div>

      <motion.a
        href="#salam"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 font-eyebrow text-[9px] uppercase tracking-[0.2em]"
      >
        <span className="anim-nudge flex flex-col items-center" style={{ "--dur": "1.8s" } as CSSProperties}>
          scroll
          <span className="mt-1 h-7 w-px bg-current" />
        </span>
      </motion.a>
    </section>
  );
}

const DEFAULT_VERSE =
  "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.";

function Verse({ settings }: { settings: Settings }) {
  const quote = settings.quote || DEFAULT_VERSE;
  const author = settings.quote ? settings.quote_author : "QS Ar-Rum : 21";
  return (
    <Section id="salam" band="deep" className="text-center">
      {/* the verse writes itself in, word by word */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        transition={{ staggerChildren: 0.045 }}
        className="mx-auto max-w-sm"
      >
        <motion.span
          variants={{ hidden: { opacity: 0, scale: 2 }, show: { opacity: 0.3, scale: 1 } }}
          transition={{ duration: 0.8, ease: EASE }}
          className="font-poster block text-6xl leading-none"
        >
          “
        </motion.span>
        <p className="font-script -mt-4 text-[1.55rem] leading-snug">
          {quote.split(" ").map((word, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
                show: { opacity: 1, y: 0, filter: "blur(0px)" },
              }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-block whitespace-pre"
            >
              {word}{" "}
            </motion.span>
          ))}
        </p>
        {author && (
          <motion.p
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 0.7, y: 0 } }}
            transition={{ duration: 0.6 }}
            className="font-eyebrow mt-5 text-[10px] uppercase tracking-[0.25em]"
          >
            {author}
          </motion.p>
        )}
      </motion.div>
    </Section>
  );
}

function Person({
  role,
  full,
  parents,
  instagram,
  photo,
  fallback,
  from,
}: {
  role: string;
  full: string;
  parents: string;
  instagram: string;
  photo: string;
  fallback: IllustrationKey;
  /** the groom walks in from the left, the bride from the right */
  from: "left" | "right";
}) {
  return (
    <FadeIn from={from} className="flex flex-col items-center text-center">
      <ArchFrame src={photo} fallback={fallback} className="h-56 w-40" alt={full} />
      <p className="font-eyebrow mt-5 text-[10px] uppercase tracking-[0.25em]" style={{ color: NAVY }}>
        {role}
      </p>
      <h3 className="font-heading mt-1 text-[1.7rem] leading-tight">{full}</h3>
      {parents && <p className="font-body mt-1.5 max-w-[260px] text-[13px] leading-relaxed opacity-75">{parents}</p>}
      {instagram && (
        <a
          href={`https://instagram.com/${instagram.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3F6B57] px-3.5 py-1.5 font-code text-xs text-[#F6FAF2] transition-transform hover:-translate-y-0.5"
        >
          <Instagram className="h-3.5 w-3.5" /> {instagram.replace("@", "")}
        </a>
      )}
    </FadeIn>
  );
}

function Couple({ settings }: { settings: Settings }) {
  return (
    <Section id="mempelai" band="paper">
      <Heading eyebrow="bride & groom" title="Mempelai" />
      <FadeIn>
        <p className="font-body mx-auto mb-10 max-w-sm text-center text-sm leading-relaxed opacity-80">
          Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu, Saudara/i untuk
          menghadiri acara pernikahan kami.
        </p>
      </FadeIn>
      <Person
        role="Mempelai Pria"
        full={settings.groom_full_name || settings.groom_name}
        parents={settings.groom_parents}
        instagram={settings.groom_instagram}
        photo={settings.groom_photo}
        fallback="cafe"
        from="left"
      />
      {/* the lines reach out from the middle, then the "&" spins into place between them */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.8 }}
        className="my-7 flex items-center justify-center gap-4"
      >
        <motion.span
          variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
          transition={{ duration: 0.7, ease: EASE }}
          className="h-px w-14 origin-right bg-[#3F6B57]/30"
        />
        <motion.span
          variants={{ hidden: { opacity: 0, scale: 0, rotate: -180 }, show: { opacity: 1, scale: 1, rotate: 0 } }}
          transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.2 }}
          className="font-script text-6xl leading-none"
          style={{ color: RED }}
        >
          &amp;
        </motion.span>
        <motion.span
          variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
          transition={{ duration: 0.7, ease: EASE }}
          className="h-px w-14 origin-left bg-[#3F6B57]/30"
        />
      </motion.div>
      <Person
        role="Mempelai Wanita"
        full={settings.bride_full_name || settings.bride_name}
        parents={settings.bride_parents}
        instagram={settings.bride_instagram}
        photo={settings.bride_photo}
        fallback="dinner"
        from="right"
      />
    </Section>
  );
}

function SaveTheDate({ settings }: { settings: Settings }) {
  const d = weddingDate(settings);
  const gcal = calendarUrl(settings);
  return (
    <Section id="tanggal" band="mint" className="text-center">
      <Heading eyebrow="save the date" title="Hari Bahagia" />
      <div>
        {d && (
          // weekday slides in from the left, month from the right, and the day drops in between them
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.8 }}
            className="mx-auto mb-7 flex w-fit items-center gap-4"
          >
            <motion.span
              variants={{ hidden: { opacity: 0, x: -30 }, show: { opacity: 0.7, x: 0 } }}
              transition={{ duration: 0.7, ease: EASE }}
              className="font-eyebrow text-[11px] uppercase tracking-[0.2em]"
            >
              {new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(d)}
            </motion.span>
            <motion.span
              variants={{ hidden: { opacity: 0, y: -50, scale: 1.6 }, show: { opacity: 1, y: 0, scale: 1 } }}
              transition={{ type: "spring", stiffness: 200, damping: 11, delay: 0.25 }}
              className="font-poster border-x-2 border-[#3F6B57]/30 px-4 text-6xl leading-none"
              style={{ color: RED }}
            >
              {String(d.getDate()).padStart(2, "0")}
            </motion.span>
            <motion.span
              variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 0.7, x: 0 } }}
              transition={{ duration: 0.7, ease: EASE }}
              className="font-eyebrow text-left text-[11px] uppercase leading-tight tracking-[0.2em]"
            >
              {new Intl.DateTimeFormat("id-ID", { month: "long" }).format(d)}
              <br />
              {d.getFullYear()}
            </motion.span>
          </motion.div>
        )}
        <FadeIn from="zoom" delay={0.15} className="flex justify-center">
          <FlipCountdown target={settings.wedding_date} size="lg" />
        </FadeIn>
        <FadeIn delay={0.25}>
          <p className="font-script mx-auto mt-6 max-w-xs text-xl leading-snug opacity-80">
            Satu hari yang kami tunggu sejak lama, dan kami ingin Anda ada di dalamnya.
          </p>
        </FadeIn>
        {gcal && (
          <a
            href={gcal}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#3F6B57] px-5 py-2.5 font-code text-xs text-[#F6FAF2] shadow-[3px_4px_0_rgba(47,61,53,0.25)] transition-transform hover:-translate-y-0.5"
          >
            <CalendarHeart className="h-4 w-4" /> Simpan ke kalender
          </a>
        )}
      </div>
    </Section>
  );
}

/** a section whose body is one of the dashboard's panels */
function PanelSection({
  id,
  band,
  eyebrow,
  title,
  children,
}: {
  id: string;
  band: Band;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Section id={id} band={band}>
      <Heading eyebrow={eyebrow} title={title} />
      <FadeIn amount={0.08}>{children}</FadeIn>
    </Section>
  );
}

function Closing({ settings }: { settings: Settings }) {
  const date = formatLongDate(settings.wedding_date);
  return (
    <Section id="penutup" band="deep" className="pb-28 text-center lg:pb-16">
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <ArchFrame fallback="champions" className="h-52 w-40" />
        <FadeIn delay={0.2}>
          <p className="font-body mt-8 text-sm leading-relaxed opacity-85">
            Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan
            memberikan doa restu kepada kami.
          </p>
        </FadeIn>
        <FadeIn delay={0.35}>
          <p className="font-script mt-5 text-2xl" style={{ color: BLUSH }}>
            Kami yang berbahagia,
          </p>
        </FadeIn>
        <FadeIn from="zoom" delay={0.5}>
          <p className="font-poster mt-1 text-4xl leading-tight">
            {settings.groom_name} <span className="font-script font-normal" style={{ color: BLUSH }}>&amp;</span>{" "}
            {settings.bride_name}
          </p>
        </FadeIn>
        {date && (
          <FadeIn from="fade" delay={0.7}>
            <p className="font-eyebrow mt-3 text-[10px] uppercase tracking-[0.25em] opacity-60">{date}</p>
          </FadeIn>
        )}
        {/* a last heart that keeps beating at the very end of the page */}
        <span className="anim-beat mt-6 inline-block" style={{ "--dur": "2.2s" } as CSSProperties}>
          <Heart color={BLUSH} animate={false} className="h-6 w-auto" />
        </span>
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
      className="fixed bottom-4 right-3 z-[55] flex h-11 items-center gap-1.5 rounded-full bg-[#2F4A3E] pl-3 pr-3.5 font-eyebrow text-[9px] uppercase tracking-[0.12em] text-[#F6FAF2] shadow-[0_6px_18px_rgba(47,74,62,0.35)] sm:bottom-20 sm:right-4"
    >
      <span className="relative grid h-6 w-6 place-items-center rounded-full bg-[#F6FAF2] text-[#2F4A3E]">
        {state === "running" && <span className="absolute inset-0 animate-ping rounded-full bg-[#F6FAF2]/40" />}
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
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[calc(100%-480px)] flex-col items-center justify-center overflow-hidden bg-[#F2F6EF] px-10 text-center text-[#2F3D35] lg:flex">
      <WashBackdrop />
      <FlowerFrame />
      <DoodleField kind="love" />
      <div className="crayon-box pointer-events-none absolute inset-6 rounded-[18px]" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.8, ease: "backOut" }}
        className="relative"
      >
        <Illustration name="hello" className="h-[30vh] max-h-64 w-auto" />
        <Heart color={BLUSH} className="absolute -right-3 top-2 h-8 w-auto" delay={0.9} />
        <Emphasis className="absolute -left-5 top-1/3 h-10 w-auto" />
      </motion.div>

      <p className="font-eyebrow relative mb-1 mt-4 text-[11px] uppercase text-[#2F3D35]/60">The Wedding Of</p>
      <h1 className="font-script relative text-7xl font-bold leading-tight">
        {settings.bride_name || "Bride"} &amp; {settings.groom_name || "Groom"}
      </h1>
      <p className="font-code relative mt-1 text-sm tracking-[0.3em] opacity-70">{dotDate(settings)}</p>

      {(settings.bride_parents || settings.groom_parents) && (
        <div className="relative mt-3 grid w-full max-w-sm grid-cols-2 gap-4 font-body text-xs leading-relaxed text-[#2F3D35]/75">
          {[
            [settings.bride_name, settings.bride_parents],
            [settings.groom_name, settings.groom_parents],
          ].map(
            ([name, parents]) =>
              parents && (
                <p key={name}>
                  <span className="font-heading text-sm text-[#2F3D35]">{name}</span>
                  <br />
                  {parents}
                </p>
              )
          )}
        </div>
      )}

      {guest && (
        <div
          className="wc crayon-box relative mt-6 w-full max-w-xs rounded-[14px] px-6 py-4"
          style={{ backgroundColor: "#F3DDD8", boxShadow: "4px 4px 0 0 #C3D0AE" }}
        >
          <p className="font-eyebrow text-[9px] uppercase text-[#2F3D35]/60">Kepada Yth. Bapak/Ibu/Saudara/i</p>
          <p className="mt-1.5 font-heading text-2xl">{guest}</p>
        </div>
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
        <Wave from="paper" to="deep" />
        <Verse settings={settings} />
        <Wave from="deep" to="paper" flip />
        <Couple settings={settings} />
        <Wave from="paper" to="mint" />
        <SaveTheDate settings={settings} />
        <Wave from="mint" to="paper" flip />
        <PanelSection id="acara" band="paper" eyebrow="akad & resepsi" title="Acara">
          <CeremonyPanel settings={settings} variant="scroll" />
        </PanelSection>
        <Wave from="paper" to="mint" flip />
        <PanelSection id="galeri" band="mint" eyebrow="our moments" title="Galeri">
          <GalleryPanel gallery={gallery} />
        </PanelSection>
        <Wave from="mint" to="paper" />
        <PanelSection id="hadiah" band="paper" eyebrow="wedding gift" title="Tanda Kasih">
          <p className="font-body mx-auto -mt-2 mb-6 max-w-sm text-center text-sm leading-relaxed opacity-80">
            Doa restu Anda adalah karunia yang sangat berarti bagi kami. Bila ingin memberi tanda kasih, bisa
            melalui:
          </p>
          <GiftPanel settings={settings} gifts={gifts} />
        </PanelSection>
        <Wave from="paper" to="mint" flip />
        <PanelSection id="rsvp" band="mint" eyebrow="rsvp & wishes" title="Ucapan">
          <RsvpPanel />
        </PanelSection>
        <Wave from="mint" to="deep" />
        <Closing settings={settings} />
      </div>

      <AutoScroll />
    </main>
    </MotionConfig>
  );
}
