"use client";

import { motion } from "framer-motion";
import Ornament from "./Ornament";

/**
 * Consistent elegant section header: a small letter-spaced label, a large
 * serif title, and a gilt ornament divider.
 */
export default function SectionHeading({
  label,
  title,
  className = "",
}: {
  label?: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      {label && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-label text-[11px] text-accent/80"
        >
          {label}
        </motion.p>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.05, duration: 0.7 }}
        className="mt-3 font-serif text-4xl font-medium tracking-tight text-primary sm:text-5xl"
      >
        {title}
      </motion.h2>
      <Ornament className="mt-5" />
    </div>
  );
}
