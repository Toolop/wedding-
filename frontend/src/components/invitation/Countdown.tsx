"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SectionHeading from "./SectionHeading";

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  const clamped = Math.max(diff, 0);
  return {
    days: Math.floor(clamped / (1000 * 60 * 60 * 24)),
    hours: Math.floor((clamped / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((clamped / (1000 * 60)) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
    done: diff <= 0,
  };
}

export default function Countdown({ target }: { target: string }) {
  const [time, setTime] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);

  const units = [
    { label: "Hari", value: time.days },
    { label: "Jam", value: time.hours },
    { label: "Menit", value: time.minutes },
    { label: "Detik", value: time.seconds },
  ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          label={time.done ? "Alhamdulillah" : "Menghitung Hari"}
          title={time.done ? "Hari Bahagia Telah Tiba" : "Menuju Hari Bahagia"}
        />

        <div className="mt-12 grid grid-cols-4 gap-3 sm:gap-5">
          {units.map((u, i) => (
            <motion.div
              key={u.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="frame-elegant rounded-sm bg-surface/70 py-5 backdrop-blur-sm"
            >
              <motion.span
                key={u.value}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="block font-serif text-4xl font-semibold text-primary sm:text-5xl"
              >
                {String(u.value).padStart(2, "0")}
              </motion.span>
              <span className="mt-1 block font-label text-[9px] text-primary/55 sm:text-[10px]">
                {u.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
