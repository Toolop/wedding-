"use client";

import { motion } from "framer-motion";

const SPARKLES = [
  { top: "12%", left: "8%", size: 12, delay: 0 },
  { top: "20%", left: "85%", size: 16, delay: 0.5 },
  { top: "62%", left: "15%", size: 10, delay: 1 },
  { top: "72%", left: "82%", size: 14, delay: 1.4 },
  { top: "8%", left: "48%", size: 9, delay: 1.8 },
  { top: "88%", left: "45%", size: 12, delay: 0.8 },
  { top: "40%", left: "6%", size: 8, delay: 2.1 },
  { top: "45%", left: "92%", size: 10, delay: 0.3 },
];

function Sparkle({ size, delay }: { size: number; delay: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      initial={{ opacity: 0.15, scale: 0.6, rotate: 0 }}
      animate={{ opacity: [0.15, 1, 0.15], scale: [0.6, 1.2, 0.6], rotate: [0, 30, 0] }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M12 0 C12 6 14 10 24 12 C14 14 12 18 12 24 C12 18 10 14 0 12 C10 10 12 6 12 0 Z"
        fill="currentColor"
      />
    </motion.svg>
  );
}

export default function MagicSparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 text-accent">
      {SPARKLES.map((s, i) => (
        <div key={i} className="absolute" style={{ top: s.top, left: s.left }}>
          <Sparkle size={s.size} delay={s.delay} />
        </div>
      ))}
    </div>
  );
}
