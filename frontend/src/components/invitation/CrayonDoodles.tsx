"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Shared SVG filters that give strokes a rough, waxy crayon edge (à la Florence).
 * Render <CrayonDefs /> once near the root; doodles reference it by id.
 */
export function CrayonDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <filter id="crayon" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.024"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="3.2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="crayon-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves="2"
            seed="3"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" />
        </filter>
      </defs>
    </svg>
  );
}

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  filter: "url(#crayon)",
};

function DrawPath({
  d,
  delay = 0,
  duration = 0.9,
  fill,
}: {
  d: string;
  delay?: number;
  duration?: number;
  fill?: string;
}) {
  return (
    <motion.path
      d={d}
      {...stroke}
      fill={fill ?? "none"}
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{
        pathLength: { duration, delay, ease: "easeInOut" },
        opacity: { duration: 0.25, delay },
      }}
    />
  );
}

/** Wrap any doodle to make it gently float/sway forever — the "GIF" feel. */
export function Float({
  children,
  className = "",
  style,
  dist = 10,
  rotate = 6,
  dur = 4.5,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  dist?: number;
  rotate?: number;
  dur?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      animate={{ y: [0, -dist, 0], rotate: [-rotate, rotate, -rotate] }}
      transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

type DoodleProps = { size?: number; delay?: number; className?: string };

export function Heart({ size = 34, delay = 0, className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <DrawPath
        d="M12 20.5C10 18.5 3.5 14.5 3.5 8.8 3.5 6 5.6 4 8 4c2 0 3.2 1.3 4 2.6C12.8 5.3 14 4 16 4c2.4 0 4.5 2 4.5 4.8 0 5.7-6.5 9.7-8.5 11.7Z"
        delay={delay}
        duration={1}
      />
    </svg>
  );
}

export function Sparkle({ size = 26, delay = 0, className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <DrawPath
        d="M12 2C12.6 7 13 8.4 17.5 9.5 13 10.6 12.6 12 12 17c-.6-5-1-6.4-5.5-7.5C11 8.4 11.4 7 12 2Z"
        delay={delay}
        duration={0.8}
      />
    </svg>
  );
}

export function Brackets({ size = 40, delay = 0, className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 32 24" width={size} height={size * 0.75} className={className}>
      <DrawPath d="M10 5 L3 12 L10 19" delay={delay} duration={0.55} />
      <DrawPath d="M22 5 L29 12 L22 19" delay={delay + 0.15} duration={0.55} />
      <DrawPath d="M18 3 L14 21" delay={delay + 0.3} duration={0.5} />
    </svg>
  );
}

export function ChartBars({ size = 34, delay = 0, className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <DrawPath d="M3 21 H21" delay={delay} duration={0.4} />
      <DrawPath d="M6 21 V15" delay={delay + 0.25} duration={0.35} />
      <DrawPath d="M11 21 V9" delay={delay + 0.4} duration={0.4} />
      <DrawPath d="M16 21 V13" delay={delay + 0.55} duration={0.35} />
      <DrawPath d="M21 21 V5" delay={delay + 0.7} duration={0.45} />
    </svg>
  );
}

export function Coffee({ size = 30, delay = 0, className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <DrawPath
        d="M4 10 H17 V15 A4 4 0 0 1 13 19 H8 A4 4 0 0 1 4 15 Z"
        delay={delay}
        duration={0.7}
      />
      <DrawPath d="M17 11 H19.5 A2 2 0 0 1 19.5 15 H17" delay={delay + 0.3} duration={0.4} />
      <DrawPath d="M8 3 Q9.5 5 8 7" delay={delay + 0.5} duration={0.4} />
      <DrawPath d="M12.5 3 Q14 5 12.5 7" delay={delay + 0.6} duration={0.4} />
    </svg>
  );
}

export function Squiggle({
  width = 160,
  delay = 0,
  className = "",
}: {
  width?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 160 14" width={width} height={width * 0.0875} className={className}>
      <DrawPath
        d="M3 8 Q23 -2 43 8 T83 8 T123 8 T157 8"
        delay={delay}
        duration={1}
      />
    </svg>
  );
}

export function ArrowDown({ size = 30, delay = 0, className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <DrawPath d="M12 3 L12 19" delay={delay} duration={0.4} />
      <DrawPath d="M6 13 L12 20 L18 13" delay={delay + 0.2} duration={0.4} />
    </svg>
  );
}

/**
 * A hand-drawn crayon frame that "draws itself" around a panel image.
 * Sits absolutely over its rounded parent.
 */
export function DrawnFrame({ delay = 0 }: { delay?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] text-primary/70"
    >
      <motion.path
        d="M6 3 H94 Q97 3 97 6 V94 Q97 97 94 97 H6 Q3 97 3 94 V6 Q3 3 6 3 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        filter="url(#crayon-soft)"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{
          pathLength: { duration: 1.4, delay, ease: "easeInOut" },
          opacity: { duration: 0.2, delay },
        }}
      />
    </svg>
  );
}

type Scatter = { x: string; y: string; delay: number; dur: number; scale: number };

/** Scatter a themed set of looping doodles behind a panel. */
export function DoodleField({ kind }: { kind: "code" | "data" | "love" }) {
  const spots: Scatter[] = [
    { x: "8%", y: "16%", delay: 0.2, dur: 5, scale: 0.9 },
    { x: "82%", y: "12%", delay: 0.6, dur: 4.4, scale: 1.1 },
    { x: "88%", y: "62%", delay: 0.1, dur: 5.6, scale: 0.8 },
    { x: "6%", y: "68%", delay: 0.9, dur: 4.8, scale: 1 },
    { x: "70%", y: "34%", delay: 1.3, dur: 5.2, scale: 0.7 },
    { x: "18%", y: "42%", delay: 0.4, dur: 4.6, scale: 0.75 },
  ];

  const render = (i: number) => {
    if (kind === "code")
      return i % 2 === 0 ? (
        <Brackets size={38} className="text-accent/50" />
      ) : (
        <Sparkle size={22} className="text-primary/35" />
      );
    if (kind === "data")
      return i % 2 === 0 ? (
        <ChartBars size={30} className="text-accent/50" />
      ) : (
        <Coffee size={26} className="text-primary/35" />
      );
    return i % 2 === 0 ? (
      <Heart size={26} className="text-accent/45" />
    ) : (
      <Sparkle size={22} className="text-primary/35" />
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {spots.map((s, i) => (
        <Float
          key={i}
          className="absolute"
          style={{ left: s.x, top: s.y, scale: s.scale }}
          delay={s.delay}
          dur={s.dur}
          dist={12}
          rotate={8}
        >
          {render(i)}
        </Float>
      ))}
    </div>
  );
}
