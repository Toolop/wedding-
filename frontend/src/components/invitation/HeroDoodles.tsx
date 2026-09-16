"use client";

import { motion } from "framer-motion";

/**
 * Crayon-textured illustration kit for the Florence-style hero.
 * Filter ids are namespaced (`flo-*`) so they never clash with CrayonDoodles.
 */
export function FloDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <filter id="flo-crayon" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.028"
            numOctaves="3"
            seed="11"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="2.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="flo-brush" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="5" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="18" />
        </filter>
      </defs>
    </svg>
  );
}

const ink = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  filter: "url(#flo-crayon)",
};

/** A stroke that draws itself once it scrolls into view. */
function Draw({
  d,
  delay = 0,
  duration = 0.8,
  fill,
  width,
}: {
  d: string;
  delay?: number;
  duration?: number;
  fill?: string;
  width?: number;
}) {
  return (
    <motion.path
      {...ink}
      strokeWidth={width ?? ink.strokeWidth}
      d={d}
      fill={fill ?? "none"}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ pathLength: { duration, delay, ease: "easeInOut" }, opacity: { duration: 0.2, delay } }}
    />
  );
}

type ArtProps = { className?: string; delay?: number };

/** Tear-off calendar showing the wedding day, like the reference sticker. */
export function CalendarArt({
  day,
  month,
  className = "",
  delay = 0,
}: ArtProps & { day: string; month: string }) {
  return (
    <svg viewBox="0 0 120 110" className={className} aria-hidden>
      <Draw d="M14 26 h92 a4 4 0 0 1 4 4 v66 a4 4 0 0 1 -4 4 h-92 a4 4 0 0 1 -4 -4 v-66 a4 4 0 0 1 4 -4 z" delay={delay} />
      <Draw d="M10 44 h100" delay={delay + 0.35} duration={0.5} />
      <Draw d="M30 30 v-16 M60 30 v-16 M90 30 v-16" delay={delay + 0.5} duration={0.4} />
      <Draw d="M26 20 a6 6 0 0 1 8 0 M56 20 a6 6 0 0 1 8 0 M86 20 a6 6 0 0 1 8 0" delay={delay + 0.6} duration={0.4} />
      <motion.text
        x="60"
        y="66"
        textAnchor="middle"
        className="font-heading"
        fontSize="17"
        letterSpacing="2"
        fill="currentColor"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.7 }}
      >
        {month}
      </motion.text>
      <motion.text
        x="60"
        y="94"
        textAnchor="middle"
        className="font-heading"
        fontSize="30"
        fill="currentColor"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.85, type: "spring", stiffness: 220, damping: 14 }}
      >
        {day}
      </motion.text>
    </svg>
  );
}

/** Fat hand-drawn heart, filled — the "key details" sticker. */
export function HeartArt({ className = "", delay = 0 }: ArtProps) {
  return (
    <svg viewBox="0 0 100 92" className={className} aria-hidden>
      <motion.path
        d="M50 84 C18 62 8 44 12 30 C16 14 36 10 50 26 C64 10 84 14 88 30 C92 44 82 62 50 84 z"
        fill="currentColor"
        filter="url(#flo-crayon)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay, type: "spring", stiffness: 180, damping: 12 }}
        style={{ transformOrigin: "50px 50px" }}
      />
      <motion.path
        d="M34 34 c4 -6 12 -6 15 0"
        {...ink}
        stroke="var(--flo-paper, #FFF6DA)"
        strokeWidth={3}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: delay + 0.4, duration: 0.5 }}
      />
    </svg>
  );
}

/** Stack of wrapped gifts for the registry sticker. */
export function GiftArt({ className = "", delay = 0 }: ArtProps) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <Draw d="M16 52 h44 v40 h-44 z" delay={delay} />
      <Draw d="M14 42 h48 v12 h-48 z" delay={delay + 0.25} duration={0.5} />
      <Draw d="M38 42 v50" delay={delay + 0.45} duration={0.4} />
      <Draw d="M38 42 c-14 -4 -16 -18 -4 -16 c7 1 4 10 4 16 z M38 42 c14 -4 16 -18 4 -16 c-7 1 -4 10 -4 16 z" delay={delay + 0.55} duration={0.6} />
      <Draw d="M66 62 h38 v30 h-38 z" delay={delay + 0.35} />
      <Draw d="M64 54 h42 v10 h-42 z" delay={delay + 0.5} duration={0.4} />
      <Draw d="M85 54 v38" delay={delay + 0.65} duration={0.35} />
      <Draw d="M85 54 c-10 -3 -12 -13 -3 -12 c5 1 3 8 3 12 z M85 54 c10 -3 12 -13 3 -12 c-5 1 -3 8 -3 12 z" delay={delay + 0.75} duration={0.5} />
    </svg>
  );
}

/** Little instant camera — the gallery sticker. */
export function CameraArt({ className = "", delay = 0 }: ArtProps) {
  return (
    <svg viewBox="0 0 120 96" className={className} aria-hidden>
      <Draw d="M12 30 h22 l8 -12 h36 l8 12 h22 a4 4 0 0 1 4 4 v48 a4 4 0 0 1 -4 4 h-96 a4 4 0 0 1 -4 -4 v-48 a4 4 0 0 1 4 -4 z" delay={delay} duration={1} />
      <Draw d="M60 40 a18 18 0 1 0 0.1 0 z" delay={delay + 0.5} duration={0.7} />
      <Draw d="M60 48 a10 10 0 1 0 0.1 0 z" delay={delay + 0.75} duration={0.5} />
      <Draw d="M96 38 h8" delay={delay + 0.9} duration={0.3} />
      <motion.g
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 0.35, 1], scale: 1 }}
        transition={{ delay: delay + 1, duration: 1.6, repeat: Infinity, repeatDelay: 2.4 }}
        style={{ transformOrigin: "100px 22px" }}
      >
        <path {...ink} strokeWidth={2} d="M100 12 v-8 M108 20 h8 M92 20 h-8 M106 14 l6 -6 M94 14 l-6 -6" />
      </motion.g>
    </svg>
  );
}

/** Two joined rings, used for the ceremony sticker + footer strip. */
export function RingsArt({ className = "", delay = 0 }: ArtProps) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      <Draw d="M42 46 a20 20 0 1 0 0.1 0 z" delay={delay} duration={0.8} />
      <Draw d="M74 46 a20 20 0 1 0 0.1 0 z" delay={delay + 0.25} duration={0.8} />
      <Draw d="M74 26 l-6 -10 h12 z" delay={delay + 0.6} duration={0.4} />
      <motion.path
        d="M40 14 l4 8 l8 4 l-8 4 l-4 8 l-4 -8 l-8 -4 l8 -4 z"
        fill="currentColor"
        filter="url(#flo-crayon)"
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: [0, 1, 0.85, 1], rotate: 0 }}
        transition={{ delay: delay + 0.8, duration: 1.2 }}
        style={{ transformOrigin: "40px 26px" }}
      />
    </svg>
  );
}

/** A little crowd — the guest list / RSVP sticker. */
export function PeopleArt({ className = "", delay = 0 }: ArtProps) {
  return (
    <svg viewBox="0 0 130 90" className={className} aria-hidden>
      {[8, 42, 76].map((x, i) => (
        <g key={x}>
          <Draw d={`M${x + 14} 34 a11 11 0 1 0 0.1 0 z`} delay={delay + i * 0.18} duration={0.6} />
          <Draw d={`M${x} 84 c0 -18 8 -28 14 -28 c6 0 14 10 14 28`} delay={delay + i * 0.18 + 0.3} duration={0.6} />
        </g>
      ))}
      <Draw d="M108 40 a9 9 0 1 0 0.1 0 z" delay={delay + 0.6} duration={0.5} />
      <Draw d="M96 84 c0 -16 6 -24 12 -24 c6 0 12 8 12 24" delay={delay + 0.8} duration={0.5} />
      <motion.path
        d="M64 16 c-6 -8 -18 -4 -14 6 c3 7 14 12 14 12 c0 0 11 -5 14 -12 c4 -10 -8 -14 -14 -6 z"
        fill="currentColor"
        filter="url(#flo-crayon)"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.15, 1] }}
        transition={{ delay: delay + 0.9, duration: 0.7 }}
        style={{ transformOrigin: "64px 22px" }}
      />
    </svg>
  );
}

/** Open book with a bookmark — the love-story sticker. */
export function BookArt({ className = "", delay = 0 }: ArtProps) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden>
      <Draw d="M60 26 c-12 -10 -30 -12 -46 -8 v54 c16 -4 34 -2 46 8 z" delay={delay} duration={0.9} />
      <Draw d="M60 26 c12 -10 30 -12 46 -8 v54 c-16 -4 -34 -2 -46 8 z" delay={delay + 0.2} duration={0.9} />
      <Draw d="M60 26 v54" delay={delay + 0.6} duration={0.4} />
      <Draw d="M24 38 h24 M24 50 h20 M72 38 h24 M72 50 h20" delay={delay + 0.75} duration={0.6} />
      <motion.path
        d="M80 18 h12 v22 l-6 -6 l-6 6 z"
        fill="currentColor"
        filter="url(#flo-crayon)"
        initial={{ y: -14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: delay + 0.9, type: "spring", stiffness: 200, damping: 14 }}
      />
    </svg>
  );
}

/** The couple on the yellow sofa that anchors the reference artwork. */
export function SofaArt({ className = "", delay = 0 }: ArtProps) {
  return (
    <svg viewBox="0 0 220 130" className={className} aria-hidden>
      <Draw d="M22 118 v-40 a12 12 0 0 1 12 -12 h152 a12 12 0 0 1 12 12 v40" delay={delay} duration={1.1} />
      <Draw d="M22 96 h176" delay={delay + 0.5} duration={0.6} />
      <Draw d="M40 118 v10 M180 118 v10" delay={delay + 0.7} duration={0.3} />
      {/* two figures leaning together */}
      <Draw d="M84 66 a12 12 0 1 0 0.1 0 z" delay={delay + 0.5} duration={0.5} />
      <Draw d="M66 96 c0 -18 8 -26 18 -26 c10 0 18 8 18 26" delay={delay + 0.7} duration={0.6} />
      <Draw d="M126 68 a11 11 0 1 0 0.1 0 z" delay={delay + 0.6} duration={0.5} />
      <Draw d="M110 96 c0 -16 8 -24 17 -24 c9 0 17 8 17 24" delay={delay + 0.8} duration={0.6} />
      <motion.path
        d="M105 44 c-5 -7 -15 -3 -12 5 c3 6 12 10 12 10 c0 0 9 -4 12 -10 c3 -8 -7 -12 -12 -5 z"
        fill="currentColor"
        filter="url(#flo-crayon)"
        initial={{ scale: 0, y: 6 }}
        animate={{ scale: [0.9, 1.1, 0.9], y: [0, -6, 0] }}
        transition={{ delay: delay + 1, duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "105px 52px" }}
      />
    </svg>
  );
}

/* ---- tiny line icons for the bottom strip ---- */

export function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 44" className={className} aria-hidden>
      <path {...ink} d="M20 40 C10 28 6 22 6 16 A14 14 0 0 1 34 16 C34 22 30 28 20 40 z" />
      <path {...ink} d="M20 22 a6 6 0 1 0 0.1 0 z" />
    </svg>
  );
}

export function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" className={className} aria-hidden>
      <path {...ink} d="M22 4 a18 18 0 1 0 0.1 0 z" />
      <path {...ink} d="M22 12 v11 l8 5" />
    </svg>
  );
}

export function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" className={className} aria-hidden>
      <path
        {...ink}
        d="M10 8 c6 -4 8 -2 11 6 c1 3 -3 5 -3 8 c0 5 4 9 9 9 c3 0 5 -4 8 -3 c8 3 10 5 6 11 c-3 4 -12 4 -20 -4 c-8 -8 -14 -22 -11 -27 z"
      />
    </svg>
  );
}

/** Loose paint strokes in the background, drifting slowly. */
export function BrushBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.svg
        viewBox="0 0 600 400"
        className="absolute -left-24 bottom-0 h-[70%] w-[70%] opacity-90"
        aria-hidden
        animate={{ x: [0, 14, 0], y: [0, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M40 300 C120 210 260 250 340 190 C420 130 520 160 560 120 L570 250 C480 300 380 280 300 320 C220 360 120 370 50 350 z"
          fill="#C8145F"
          opacity="0.85"
          filter="url(#flo-brush)"
        />
      </motion.svg>
      <motion.svg
        viewBox="0 0 600 400"
        className="absolute -right-16 top-0 h-[60%] w-[60%]"
        aria-hidden
        animate={{ x: [0, -16, 0], y: [0, 12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M80 120 C180 40 320 70 430 30 C500 5 560 20 590 60 L580 190 C470 230 340 190 240 230 C160 262 90 240 60 200 z"
          fill="#7FC4E8"
          opacity="0.75"
          filter="url(#flo-brush)"
        />
      </motion.svg>
      <motion.svg
        viewBox="0 0 400 300"
        className="absolute bottom-[8%] right-[12%] h-[30%] w-[30%]"
        aria-hidden
        animate={{ rotate: [0, 3, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M40 180 C110 110 210 150 300 90 L330 170 C250 220 140 210 60 240 z"
          fill="#F2A08A"
          opacity="0.7"
          filter="url(#flo-brush)"
        />
      </motion.svg>
    </div>
  );
}
