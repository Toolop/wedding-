"use client";

import { motion } from "framer-motion";

const PALETTE = [
  { petal: "#e8e6e1", edge: "#7c868e", center: "#4a7fa5" },
  { petal: "#c9cdd1", edge: "#5f6a72", center: "#2e3237" },
  { petal: "#dde4ea", edge: "#4a7fa5", center: "#2e3237" },
  { petal: "#d6d4cf", edge: "#7c868e", center: "#4a7fa5" },
];

export function Flower({
  size,
  delay,
  colorIndex = 0,
  bloom = true,
  bloomDelay,
}: {
  size: number;
  delay: number;
  colorIndex?: number;
  bloom?: boolean;
  bloomDelay?: number;
}) {
  const palette = PALETTE[colorIndex % PALETTE.length];
  const petalCount = 6;
  const petals = Array.from({ length: petalCount });

  return (
    <motion.div
      initial={{ rotate: -4 }}
      animate={{ rotate: [-4, 4, -4] }}
      transition={{ duration: 4.5 + delay, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "bottom center", width: size, height: size * 1.9 }}
      className="relative flex-none"
    >
      <svg
        viewBox="0 0 100 190"
        width={size}
        height={size * 1.9}
        className="overflow-visible"
      >
        {/* stem */}
        <path
          d="M50 95 C 48 130, 52 155, 50 188"
          stroke="#9aa3ab"
          strokeWidth="3"
          fill="none"
        />
        {/* leaves */}
        <path d="M50 140 C 30 138, 20 150, 15 165 C 32 165, 45 155, 50 140 Z" fill="#9aa3ab" />
        <path d="M50 120 C 70 118, 82 128, 88 142 C 70 143, 56 134, 50 120 Z" fill="#9aa3ab" />

        {/* bloom */}
        <motion.g
          initial={bloom ? { scale: 0.15, opacity: 0 } : { scale: 1, opacity: 1 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            delay: bloomDelay ?? delay * 0.15,
            ease: "backOut",
          }}
          style={{ transformOrigin: "50px 90px" }}
        >
          {petals.map((_, i) => {
            const angle = (360 / petalCount) * i;
            return (
              <ellipse
                key={i}
                cx="50"
                cy="62"
                rx="16"
                ry="26"
                fill={palette.petal}
                stroke={palette.edge}
                strokeWidth="1"
                opacity="0.95"
                transform={`rotate(${angle} 50 90)`}
              />
            );
          })}
          <circle cx="50" cy="90" r="12" fill={palette.center} />
        </motion.g>
      </svg>
    </motion.div>
  );
}

export default function FlowerBorder({ className = "" }: { className?: string }) {
  const flowers = [
    { size: 40, delay: 0.2, c: 0 },
    { size: 56, delay: 0.6, c: 1 },
    { size: 46, delay: 0.1, c: 2 },
    { size: 62, delay: 0.9, c: 3 },
    { size: 42, delay: 0.4, c: 1 },
    { size: 58, delay: 0.7, c: 0 },
    { size: 48, delay: 0.3, c: 2 },
    { size: 52, delay: 0.5, c: 3 },
    { size: 40, delay: 0.8, c: 1 },
  ];

  return (
    <div
      className={`pointer-events-none relative flex items-end justify-center gap-1 overflow-x-hidden sm:gap-3 ${className}`}
    >
      {flowers.map((f, i) => (
        <Flower key={i} size={f.size} delay={f.delay} colorIndex={f.c} />
      ))}
    </div>
  );
}
