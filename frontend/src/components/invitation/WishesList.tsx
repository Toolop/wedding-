"use client";

import { motion } from "framer-motion";
import { MessageCircleHeart, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getWishes } from "@/lib/api";
import type { Wish } from "@/lib/types";
import SectionHeading from "./SectionHeading";

const ATTENDANCE_META = {
  hadir: { label: "Hadir", icon: CheckCircle2, color: "text-emerald-600" },
  tidak_hadir: { label: "Tidak Hadir", icon: XCircle, color: "text-rose-600" },
  masih_ragu: { label: "Masih Ragu", icon: HelpCircle, color: "text-amber-600" },
};

export default function WishesList({ refreshKey }: { refreshKey: number }) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;

  useEffect(() => {
    getWishes(page, limit).then((res) => {
      setWishes(res.items);
      setTotal(res.total);
    });
  }, [page, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="bg-secondary/40 px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <SectionHeading label="Doa Restu" title="Ucapan & Doa" />

        <div className="mt-12 space-y-3">
          {wishes.length === 0 && (
            <p className="text-center text-sm text-primary/50">
              Belum ada ucapan. Jadilah yang pertama!
            </p>
          )}
          {wishes.map((w, i) => {
            const meta = ATTENDANCE_META[w.attendance];
            const Icon = meta?.icon || MessageCircleHeart;
            return (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % limit) * 0.07 }}
                className="rounded-sm border border-gold/30 bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-semibold text-primary">
                    {w.name}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs ${meta?.color || "text-primary/50"}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {meta?.label}
                  </span>
                </div>
                {w.message && (
                  <p className="mt-1.5 text-sm leading-relaxed text-primary/70">
                    {w.message}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  page === i + 1 ? "bg-accent" : "bg-accent/30"
                }`}
                aria-label={`Halaman ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
