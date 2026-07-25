"use client";

import { motion } from "framer-motion";

/**
 * A delicate gilt divider — two tapering rules meeting a small diamond/leaf
 * motif in the centre. Used beneath section titles and between blocks.
 */
export default function Ornament({
  className = "",
  width = 200,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className={`mx-auto flex items-center justify-center text-gold ${className}`}
      style={{ width }}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/60" />
      <svg
        viewBox="0 0 48 24"
        width={44}
        height={22}
        fill="none"
        className="mx-2 flex-none"
        aria-hidden
      >
        <path
          d="M24 4c3 4 6 6 10 8-4 2-7 4-10 8-3-4-6-6-10-8 4-2 7-4 10-8Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <circle cx="24" cy="12" r="1.4" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/60" />
    </motion.div>
  );
}
