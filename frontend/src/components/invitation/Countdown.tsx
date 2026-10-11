"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { parseDate } from "@/lib/dates";
import { INK, TONES, type ToneKey } from "./watercolor";

export type TimeLeft = { d: number; h: number; m: number; s: number; done: boolean };

/** ticks every second toward `target`; null until mounted or when the date is unset */
export function useCountdown(target: string) {
  const [left, setLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const date = parseDate(target);
    if (!date) return;
    const tick = () => {
      const diff = Math.max(0, date.getTime() - Date.now());
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor(diff / 3600000) % 24,
        m: Math.floor(diff / 60000) % 60,
        s: Math.floor(diff / 1000) % 60,
        done: diff === 0,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return left;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** one split-flap tile: the number drops in from above whenever it changes */
function FlipTile({
  value,
  label,
  tone,
  size,
}: {
  value: string;
  label: string;
  tone: ToneKey;
  size: "sm" | "lg";
}) {
  const t = TONES[tone];
  const big = size === "lg";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative overflow-hidden rounded-[10px] crayon-box wc ${
          big ? "h-[68px] w-[64px] sm:h-[76px] sm:w-[74px]" : "h-[46px] w-[50px] sm:h-[50px] sm:w-[56px]"
        }`}
        style={{ backgroundColor: t.bg, color: INK, boxShadow: `3px 4px 0 0 ${t.edge}` }}
      >
        {/* the hinge across the middle of a flip clock */}
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-[#2B2522]/20" />
        <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-white/25" />
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: "-55%", opacity: 0, rotateX: 70 }}
            animate={{ y: "0%", opacity: 1, rotateX: 0 }}
            exit={{ y: "45%", opacity: 0, rotateX: -60 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            className={`absolute inset-0 grid place-items-center font-poster tabular-nums ${
              big ? "text-[34px] sm:text-[40px]" : "text-[22px] sm:text-2xl"
            }`}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className={`font-eyebrow uppercase opacity-60 ${big ? "text-[9px]" : "text-[8px]"}`}>{label}</span>
    </div>
  );
}

export function FlipCountdown({ target, size = "sm" }: { target: string; size?: "sm" | "lg" }) {
  const left = useCountdown(target);
  if (left?.done) {
    return (
      <p className="font-heading text-2xl" style={{ color: INK }}>
        Hari bahagianya sudah tiba!
      </p>
    );
  }
  const units: { value: string; label: string; tone: ToneKey }[] = [
    { value: left ? String(left.d) : "--", label: "hari", tone: "mauve" },
    { value: left ? pad(left.h) : "--", label: "jam", tone: "butter" },
    { value: left ? pad(left.m) : "--", label: "menit", tone: "teal" },
    { value: left ? pad(left.s) : "--", label: "detik", tone: "coral" },
  ];
  return (
    <div className={`flex ${size === "lg" ? "gap-2.5 sm:gap-3" : "gap-1.5 sm:gap-2"}`} role="timer" aria-live="off">
      {units.map((u) => (
        <FlipTile key={u.label} {...u} size={size} />
      ))}
    </div>
  );
}
