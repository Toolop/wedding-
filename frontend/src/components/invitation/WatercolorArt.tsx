"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import {
  BLUSH,
  DENIM,
  HONEY,
  ILLUSTRATIONS,
  INK,
  NAVY,
  PAPER,
  RED,
  TEAL,
  type IllustrationKey,
} from "./watercolor";

/**
 * Watercolour-comic doodle kit matching the couple illustrations:
 * mottled paint washes sitting slightly off-register under dashed crayon ink.
 * Outlines draw in `currentColor` so they flip to cream on dark cards.
 */

/** shared SVG filters — render once near the root */
export function WatercolorDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        {/* wobbly crayon line with dry-brush gaps */}
        <filter id="wc-crayon" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="4" result="wob" />
          <feDisplacementMap in="SourceGraphic" in2="wob" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="9" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.1" result="holes" />
          <feComposite in="d" in2="holes" operator="in" />
        </filter>
        {/* blotchy watercolour fill */}
        <filter id="wc-paint" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="5" result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.2 1.45" result="a" />
          <feComposite in="d" in2="a" operator="in" />
        </filter>
        {/* big soft bleeding washes for page backgrounds */}
        <filter id="wc-bleed" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="8" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="40" result="d" />
          <feGaussianBlur in="d" stdDeviation="6" />
        </filter>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------ primitives */

const DASH = "10 2.5 16 3";

function Outline({
  d,
  width = 2.4,
  dashed = true,
}: {
  d: string;
  width?: number;
  dashed?: boolean;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? DASH : undefined}
    />
  );
}

/** paint patch, nudged off-register like a loose watercolour fill */
function Paint({ d, color, opacity = 0.9 }: { d: string; color: string; opacity?: number }) {
  return <path d={d} fill={color} opacity={opacity} transform="translate(1.2 1.4)" />;
}

type ArtProps = { className?: string; animate?: boolean; delay?: number };

function Art({
  viewBox,
  className,
  animate = true,
  delay = 0,
  paint,
  children,
}: ArtProps & { viewBox: string; paint?: ReactNode; children: ReactNode }) {
  return (
    <motion.svg
      viewBox={viewBox}
      className={className}
      aria-hidden
      initial={animate ? { opacity: 0, scale: 0.85, rotate: -4 } : false}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ delay, type: "spring", stiffness: 180, damping: 14 }}
    >
      {paint && <g filter="url(#wc-paint)">{paint}</g>}
      <g filter="url(#wc-crayon)">{children}</g>
    </motion.svg>
  );
}

/* --------------------------------------------------------- illustrations */

/** one of the couple illustrations; white paper melts into the page via multiply */
export function Illustration({ name, className = "" }: { name: IllustrationKey; className?: string }) {
  const art = ILLUSTRATIONS[name];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={art.src}
      alt={art.alt}
      draggable={false}
      className={`select-none mix-blend-multiply ${className}`}
    />
  );
}

/* ---------------------------------------------------------------- accents */

const HEART =
  "M24 41 C11 32 4 24 5.5 15 C7 7 17 4.5 24 13 C31 4.5 41 7 42.5 15 C44 24 37 32 24 41 Z";

/** the little hand-drawn heart floating above every illustration */
export function Heart({ color, className = "", animate = true, delay = 0 }: ArtProps & { color?: string }) {
  return (
    <Art
      viewBox="0 0 48 46"
      className={className}
      animate={animate}
      delay={delay}
      paint={color ? <Paint d={HEART} color={color} /> : undefined}
    >
      <Outline d={HEART} width={3} dashed={false} />
    </Art>
  );
}

/** three short "look here!" strokes */
export function Emphasis({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 20 44" className={className} aria-hidden style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <g filter="url(#wc-crayon)">
        <Outline d="M5 6 L15 13 M3 22 L15 22 M5 38 L15 31" width={3} dashed={false} />
      </g>
    </svg>
  );
}

/** a heart with emphasis marks either side — the "key details" sticker */
export function HeartBurst({ className = "", animate = true, delay = 0 }: ArtProps) {
  return (
    <Art
      viewBox="0 0 96 64"
      className={className}
      animate={animate}
      delay={delay}
      paint={<Paint d="M48 58 C33 48 26 39 27.5 29 C29 21 39 18.5 48 27 C57 18.5 67 21 68.5 29 C70 39 63 48 48 58 Z" color={BLUSH} />}
    >
      <Outline d="M48 58 C33 48 26 39 27.5 29 C29 21 39 18.5 48 27 C57 18.5 67 21 68.5 29 C70 39 63 48 48 58 Z" width={2.6} />
      <Outline d="M8 20 L18 26 M5 34 L17 34 M8 48 L18 42 M88 20 L78 26 M91 34 L79 34 M88 48 L78 42" width={2.6} dashed={false} />
    </Art>
  );
}

export function Squiggle({ className = "", animate = true, delay = 0 }: ArtProps) {
  return (
    <Art viewBox="0 0 200 20" className={className} animate={animate} delay={delay}>
      <Outline d="M4 12 C24 2 40 20 60 10 C80 0 96 20 116 10 C136 0 152 20 172 10 C184 4 192 8 196 10" width={2.6} />
    </Art>
  );
}

export function ArrowDown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <g filter="url(#wc-crayon)">
        <Outline d="M12 3 V19 M6 13 L12 20 L18 13" width={2.2} dashed={false} />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------ card icons */

export function CalendarPage({ day, month, className = "", animate = true, delay = 0 }: ArtProps & { day: string; month: string }) {
  return (
    <Art
      viewBox="0 0 120 110"
      className={className}
      animate={animate}
      delay={delay}
      paint={
        <>
          <Paint d="M12 24 H108 V100 H12 Z" color={PAPER} />
          <Paint d="M12 24 H108 V44 H12 Z" color={RED} opacity={0.8} />
        </>
      }
    >
      <Outline d="M16 24 H104 C107 24 108 26 108 29 V95 C108 98 107 100 104 100 H16 C13 100 12 98 12 95 V29 C12 26 13 24 16 24 Z M12 44 H108" />
      <Outline d="M34 30 V14 M60 30 V14 M86 30 V14" width={3} dashed={false} />
      <text x="60" y="64" textAnchor="middle" fontSize="13" letterSpacing="2" className="font-eyebrow" fill="currentColor">
        {month}
      </text>
      <text x="60" y="94" textAnchor="middle" fontSize="34" className="font-script" fontWeight="700" fill="currentColor">
        {day}
      </text>
    </Art>
  );
}

export function GiftBox({ className = "", animate = true, delay = 0 }: ArtProps) {
  const bow = "M40 22 C32 8 20 10 25 19 C28 23 36 23 40 22 C48 8 60 10 55 19 C52 23 44 23 40 22 Z";
  return (
    <Art
      viewBox="0 0 80 76"
      className={className}
      animate={animate}
      delay={delay}
      paint={
        <>
          <Paint d="M14 32 H66 V72 H14 Z" color={BLUSH} />
          <Paint d="M10 22 H70 V32 H10 Z" color="#F4B9AE" />
          <Paint d="M36 22 H44 V72 H36 Z" color={NAVY} opacity={0.85} />
          <Paint d={bow} color={NAVY} />
        </>
      }
    >
      <Outline d="M14 32 H66 V72 H14 Z M10 22 H70 V32 H10 Z M36 32 V72 M44 32 V72" />
      <Outline d={bow} dashed={false} />
    </Art>
  );
}

export function Camera({ className = "", animate = true, delay = 0 }: ArtProps) {
  const body = "M8 24 H26 L32 13 H58 L64 24 H82 V66 H8 Z";
  const lens = "M29 44 A16 16 0 1 0 61 44 A16 16 0 1 0 29 44 Z";
  return (
    <Art
      viewBox="0 0 90 72"
      className={className}
      animate={animate}
      delay={delay}
      paint={
        <>
          <Paint d={body} color={NAVY} />
          <Paint d={lens} color="#DCE5F2" />
          <Paint d="M68 30 H76 V35 H68 Z" color={HONEY} />
        </>
      }
    >
      <Outline d={body} />
      <Outline d={lens} />
      <Outline d="M37 44 A8 8 0 1 0 53 44 A8 8 0 1 0 37 44 Z" width={2} dashed={false} />
    </Art>
  );
}

export function OpenBook({ className = "", animate = true, delay = 0 }: ArtProps) {
  const pages = "M45 14 C34 6 16 6 6 10 V62 C16 58 34 58 45 66 C56 58 74 58 84 62 V10 C74 6 56 6 45 14 Z";
  return (
    <Art
      viewBox="0 0 90 72"
      className={className}
      animate={animate}
      delay={delay}
      paint={
        <>
          <Paint d={pages} color={PAPER} />
          <Paint d="M62 8 H70 V28 L66 23 L62 28 Z" color={RED} />
        </>
      }
    >
      <Outline d={pages} />
      <Outline d="M45 14 V66" dashed={false} />
      <Outline
        d="M14 22 C22 20 30 20 38 24 M14 32 C22 30 30 30 38 34 M14 42 C22 40 30 40 38 44 M52 34 C60 30 68 30 76 32 M52 44 C60 40 68 40 76 42"
        width={1.6}
        dashed={false}
      />
    </Art>
  );
}

export function Envelope({ className = "", animate = true, delay = 0 }: ArtProps) {
  const seal = "M60 70 C50 62 50 52 60 56 C70 52 70 62 60 70 Z";
  return (
    <Art
      viewBox="0 0 120 90"
      className={className}
      animate={animate}
      delay={delay}
      paint={
        <>
          <Paint d="M8 20 H112 V84 H8 Z" color="#FFF1DF" />
          <Paint d={seal} color={RED} />
        </>
      }
    >
      <Outline d="M8 20 H112 V84 H8 Z" />
      <Outline d="M8 20 L60 58 L112 20 M8 84 L48 50 M112 84 L72 50" width={2} />
      <Outline d={seal} width={2} dashed={false} />
    </Art>
  );
}

export function Rings({ className = "", animate = true, delay = 0 }: ArtProps) {
  const circles = "M12 46 A20 20 0 1 0 52 46 A20 20 0 1 0 12 46 Z M38 46 A20 20 0 1 0 78 46 A20 20 0 1 0 38 46 Z";
  return (
    <Art
      viewBox="0 0 90 70"
      className={className}
      animate={animate}
      delay={delay}
      paint={
        <>
          <path d={circles} fill="none" stroke={HONEY} strokeWidth={6} transform="translate(1.2 1.4)" />
          <Paint d="M26 21 L32 12 L38 21 L32 27 Z" color="#DCE5F2" />
        </>
      }
    >
      <Outline d={circles} />
      <Outline d="M26 21 L32 12 L38 21 L32 27 Z" width={2} dashed={false} />
    </Art>
  );
}

export function MapPin({ className = "", animate = true, delay = 0 }: ArtProps) {
  const pin = "M30 76 C30 76 8 48 8 30 C8 16 18 6 30 6 C42 6 52 16 52 30 C52 48 30 76 30 76 Z";
  const dot = "M22 30 A8 8 0 1 0 38 30 A8 8 0 1 0 22 30 Z";
  return (
    <Art viewBox="0 0 60 80" className={className} animate={animate} delay={delay} paint={<><Paint d={pin} color={RED} /><Paint d={dot} color={PAPER} /></>}>
      <Outline d={pin} width={3} />
      <Outline d={dot} width={2.4} dashed={false} />
    </Art>
  );
}

export function ClockFace({ className = "", animate = true, delay = 0 }: ArtProps) {
  const face = "M7 35 A28 28 0 1 0 63 35 A28 28 0 1 0 7 35 Z";
  return (
    <Art viewBox="0 0 70 70" className={className} animate={animate} delay={delay} paint={<Paint d={face} color={HONEY} opacity={0.75} />}>
      <Outline d={face} width={3} />
      <Outline d="M35 18 V35 L46 42" width={3} dashed={false} />
    </Art>
  );
}

export function Phone({ className = "", animate = true, delay = 0 }: ArtProps) {
  const body = "M18 6 H44 C48 6 50 8 50 12 V72 C50 76 48 78 44 78 H18 C14 78 12 76 12 72 V12 C12 8 14 6 18 6 Z";
  return (
    <Art
      viewBox="0 0 62 84"
      className={className}
      animate={animate}
      delay={delay}
      paint={<><Paint d={body} color={NAVY} /><Paint d="M17 14 H45 V64 H17 Z" color="#B8C7E2" /></>}
    >
      <Outline d={body} width={3} />
      <Outline d="M26 70 H36" width={3} dashed={false} />
    </Art>
  );
}

/** cup of coffee on a saucer, straight out of the café illustration */
export function CoffeeCup({ className = "", animate = true, delay = 0 }: ArtProps) {
  return (
    <Art
      viewBox="0 0 90 70"
      className={className}
      animate={animate}
      delay={delay}
      paint={
        <>
          <Paint d="M6 58 C6 50 80 50 80 58 C80 66 6 66 6 58 Z" color={PAPER} />
          <Paint d="M22 20 C22 50 30 56 43 56 C56 56 64 50 64 20 Z" color={PAPER} />
          <Paint d="M24 20 C24 14 62 14 62 20 C62 26 24 26 24 20 Z" color="#C9A37A" />
        </>
      }
    >
      <Outline d="M6 58 C6 50 80 50 80 58 C80 66 6 66 6 58 Z" />
      <Outline d="M22 20 C22 50 30 56 43 56 C56 56 64 50 64 20 M22 20 C22 12 64 12 64 20 C64 28 22 28 22 20 Z M64 28 C76 26 76 44 62 44" />
    </Art>
  );
}

/** the red-and-black "#1" trophy from the champions illustration */
export function Trophy({ className = "", animate = true, delay = 0 }: ArtProps) {
  return (
    <Art
      viewBox="0 0 60 90"
      className={className}
      animate={animate}
      delay={delay}
      paint={
        <>
          <Paint d="M14 8 H46 L40 48 H20 Z" color={RED} />
          <Paint d="M24 48 H36 V64 H24 Z M14 64 H46 V78 H14 Z" color={INK} opacity={0.85} />
          <Paint d="M21 24 A9 9 0 1 0 39 24 A9 9 0 1 0 21 24 Z" color={PAPER} />
        </>
      }
    >
      <Outline d="M14 8 H46 L40 48 H20 Z M24 48 H36 V64 H24 Z M14 64 H46 V78 H14 Z" />
      <Outline d="M21 24 A9 9 0 1 0 39 24 A9 9 0 1 0 21 24 Z" width={2} dashed={false} />
      <text x="30" y="29" textAnchor="middle" fontSize="13" className="font-poster" fill="currentColor">
        1
      </text>
    </Art>
  );
}

/* -------------------------------------------------------------- backdrops */

type Wash = { color: string; opacity: number; pos: string; d: string };

const WASHES: Wash[] = [
  { color: BLUSH, opacity: 0.45, pos: "-right-28 -top-28 h-[440px] w-[540px]", d: "M80 120 C140 20 360 0 440 90 C510 170 470 320 340 340 C220 360 40 300 60 200 Z" },
  { color: DENIM, opacity: 0.3, pos: "-bottom-32 -left-28 h-[400px] w-[540px]", d: "M60 200 C40 110 180 40 300 70 C430 100 500 220 420 300 C340 370 110 330 60 200 Z" },
  { color: HONEY, opacity: 0.32, pos: "-left-16 -top-20 h-[260px] w-[320px]", d: "M40 120 C30 50 140 20 220 50 C290 80 290 170 220 200 C150 230 50 200 40 120 Z" },
  { color: TEAL, opacity: 0.22, pos: "-bottom-24 -right-20 h-[300px] w-[380px]", d: "M60 150 C60 70 200 40 290 80 C360 110 350 220 270 250 C180 280 60 230 60 150 Z" },
];

/** soft bleeding paint washes on the page, like a sheet of watercolour paper */
export function WashBackdrop({ children }: { children?: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {WASHES.map((w) => (
        <svg key={w.pos} viewBox="0 0 520 420" className={`absolute ${w.pos}`} preserveAspectRatio="none">
          <path d={w.d} fill={w.color} opacity={w.opacity} filter="url(#wc-bleed)" />
        </svg>
      ))}
      {children}
    </div>
  );
}

type Spot = { style: CSSProperties; delay: number; dur: number };

const SPOTS: Spot[] = [
  { style: { left: "8%", top: "16%" }, delay: 0.2, dur: 5 },
  { style: { left: "84%", top: "12%" }, delay: 0.6, dur: 4.4 },
  { style: { left: "88%", top: "62%" }, delay: 0.1, dur: 5.6 },
  { style: { left: "6%", top: "70%" }, delay: 0.9, dur: 4.8 },
  { style: { left: "72%", top: "34%" }, delay: 1.3, dur: 5.2 },
  { style: { left: "16%", top: "44%" }, delay: 0.4, dur: 4.6 },
];

/** hearts, sparkle marks and café props drifting behind a panel */
export function DoodleField({ kind = "love" }: { kind?: "love" | "cafe" | "win" }) {
  const render = (i: number) => {
    if (i % 3 === 1) return <Emphasis className="h-8 w-auto text-[#2B2522]/45" flip={i % 2 === 0} />;
    if (i % 3 === 2) return <Heart className="h-6 w-auto text-[#2B2522]/55" animate={false} />;
    if (kind === "cafe") return <CoffeeCup className="h-10 w-auto text-[#2B2522]/60" animate={false} />;
    if (kind === "win") return <Trophy className="h-12 w-auto text-[#2B2522]/60" animate={false} />;
    return <Heart color={BLUSH} className="h-8 w-auto text-[#2B2522]/60" animate={false} />;
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {SPOTS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={s.style}
          animate={{ y: [0, -12, 0], rotate: [-6, 6, -6] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {render(i)}
        </motion.div>
      ))}
    </div>
  );
}
