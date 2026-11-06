"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { BLUSH } from "./watercolor";
import { Heart } from "./WatercolorArt";

/*
 * Shared pieces for the frame-by-frame comic chapters (Lunch, Gbk, Comifuro,
 * Movie, Confess, Answer): the picture stage, a cross-fading frame, the
 * corner tag, chat bubbles and a couple of timing hooks.
 */

/** the picture area of a story panel, leaving the bottom free for the inset */
export function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-[4%] bottom-[21%] top-[4%] overflow-hidden rounded-[10px] bg-[#E4EEDF]">
      {children}
    </div>
  );
}

/**
 * One drawing filling the stage. Changing `src` cross-fades to the next one
 * with a slow push-in; `quick` swaps fast, for two-frame loops.
 */
export function Frame({
  src,
  position = "50% 50%",
  quick = false,
  className = "",
}: {
  src: string;
  position?: string;
  quick?: boolean;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={src}
        className="absolute inset-0"
        initial={{ opacity: 0, scale: quick ? 1 : 1.06 }}
        animate={{ opacity: 1, scale: 1.02 }}
        exit={{ opacity: 0 }}
        transition={{ opacity: { duration: quick ? 0.25 : 0.7 }, scale: { duration: 4, ease: "easeOut" } }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className={`h-full w-full select-none object-cover ${className}`}
          style={{ objectPosition: position }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

/** the little time/place tag in the stage's corner; it flips when the text changes */
export function TimeTag({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={text}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        className="font-eyebrow absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#FCFDF9]/90 px-2 py-0.5 text-[9px] text-[#2F3D35]/75 sm:text-[10px]"
      >
        {icon} {text}
      </motion.span>
    </AnimatePresence>
  );
}

/** a few blush hearts drifting up from a point on the stage */
export function HeartRise({ left = 38, top = 30, count = 3 }: { left?: number; top?: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute z-10"
          style={{ left: `${left + i * 12}%`, top: `${top}%` }}
          initial={{ opacity: 0, y: 10, scale: 0.4 }}
          animate={{ opacity: [0, 1, 1, 0], y: -40 - i * 8, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.18, duration: 1.8 }}
        >
          <Heart color={BLUSH} animate={false} className="h-6 w-auto text-[#2F3D35]" />
        </motion.span>
      ))}
    </>
  );
}

export function Bubble({ me, who, text }: { me: boolean; who: string; text: string }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`max-w-[88%] rounded-2xl px-2.5 py-1 text-[10px] font-semibold leading-tight text-[#2F3D35] sm:text-xs ${
        me ? "self-end rounded-br-sm bg-[#D5E7DA]" : "self-start rounded-bl-sm bg-[#F3DDD8]"
      }`}
    >
      <span className="font-eyebrow block text-[7px] opacity-60 sm:text-[8px]">{who}</span>
      {text}
    </motion.div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <span className="font-eyebrow pointer-events-none text-[9px] text-[#2F3D35]/60 sm:text-[10px]">{children}</span>;
}

/** step dots under a tap-through inset */
export function Dots({ count, filled, color }: { count: number; filled: number; color: string }) {
  return (
    <span className="flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: i < filled ? color : "rgba(47,61,53,0.18)" }}
        />
      ))}
    </span>
  );
}

/** run `fn` once `active` has stayed true for `ms` */
export function useAfter(active: boolean, ms: number, fn: () => void) {
  const cb = useRef(fn);
  useEffect(() => {
    cb.current = fn;
  });
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => cb.current(), ms);
    return () => clearTimeout(t);
  }, [active, ms]);
}

/**
 * Press-and-hold meter: fills while held, drains when let go, and calls
 * `onFull` once it reaches the top. Spread `bind` onto the button.
 */
export function useHold({ done, onFull, seconds = 1.6 }: { done: boolean; onFull: () => void; seconds?: number }) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const prog = useRef(0);
  const full = useRef(onFull);
  const finished = useRef(done);
  useEffect(() => {
    full.current = onFull;
    if (done) finished.current = true;
  });

  useEffect(() => {
    if (finished.current || (!holding && prog.current === 0)) return;
    let id = 0;
    let t0 = performance.now();
    const tick = (t: number) => {
      const dt = (t - t0) / 1000;
      t0 = t;
      const next = Math.min(1, Math.max(0, holding ? prog.current + dt / seconds : prog.current - dt * 1.4));
      prog.current = next;
      setProgress(next);
      if (next >= 1) {
        finished.current = true;
        full.current();
        return;
      }
      if (next > 0 || holding) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [holding, seconds]);

  const bind = {
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      // keep the press from starting a swipe on the strip
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setHolding(true);
    },
    onPointerUp: () => setHolding(false),
    onPointerCancel: () => setHolding(false),
    onKeyDown: (e: ReactKeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
        e.preventDefault();
        setHolding(true);
      }
    },
    onKeyUp: () => setHolding(false),
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  };

  return { progress: done ? 1 : progress, holding: holding && !done, bind };
}
