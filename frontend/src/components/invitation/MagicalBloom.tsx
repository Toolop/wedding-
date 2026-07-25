"use client";

import { motion } from "framer-motion";
import { Flower } from "./Flower";
import Ornament from "./Ornament";

function SparkleBurst({ delay }: { delay: number }) {
  const sparkles = [
    { x: -14, y: -6, size: 7 },
    { x: 10, y: -14, size: 9 },
    { x: 0, y: 4, size: 6 },
    { x: 16, y: 2, size: 8 },
    { x: -8, y: 10, size: 6 },
  ];

  return (
    <div className="absolute -top-6 left-1/2 h-0 w-0 -translate-x-1/2">
      {sparkles.map((s, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: [0, 1, 0], scale: [0, 1.3, 0.6] }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: delay + i * 0.07, ease: "easeOut" }}
          className="absolute block rounded-full bg-accent"
          style={{ width: s.size, height: s.size, left: s.x, top: s.y }}
        />
      ))}
    </div>
  );
}

function GrowingFlower({ index }: { index: number }) {
  const groupDelay = index * 0.8;

  return (
    <div className="relative flex flex-col items-center">
      <SparkleBurst delay={groupDelay} />
      <motion.div
        initial={{ scaleY: 0.3, opacity: 0.5 }}
        whileInView={{ scaleY: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: groupDelay + 0.5, ease: "backOut" }}
        style={{ transformOrigin: "bottom center" }}
      >
        <Flower size={46} delay={index * 0.3} colorIndex={index} bloomDelay={groupDelay + 0.6} />
      </motion.div>
      <div className="-mt-1 h-3 w-14 rounded-full bg-[#9aa3ab]/25" />
    </div>
  );
}

export default function MagicalBloom() {
  return (
    <section className="overflow-hidden px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-label text-[11px] text-accent/80"
        >
          Mekar Bersama
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mt-3 font-serif text-4xl font-medium text-primary sm:text-5xl"
        >
          Keajaiban Cinta Kami
        </motion.h2>
        <Ornament className="mt-5" width={160} />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mx-auto mt-5 max-w-md font-serif text-lg leading-relaxed text-primary/75"
        >
          Seperti bunga yang mekar oleh sentuhan keajaiban, cinta kami pun tumbuh
          indah dari takdir yang mempertemukan kita berdua.
        </motion.p>

        <div className="mt-16 flex items-end justify-center gap-10 sm:gap-16">
          {[0, 1, 2].map((i) => (
            <GrowingFlower key={i} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
