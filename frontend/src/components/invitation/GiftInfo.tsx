"use client";

import { motion } from "framer-motion";
import { Gift, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Settings } from "@/lib/types";
import SectionHeading from "./SectionHeading";

export default function GiftInfo({ settings }: { settings: Settings }) {
  const [copied, setCopied] = useState(false);

  if (!settings.bank_name && !settings.bank_account_number) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(settings.bank_account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable, ignore
    }
  };

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-md">
        <SectionHeading label="Tanda Kasih" title="Kirim Hadiah" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="frame-elegant relative mt-12 rounded-sm bg-secondary/40 p-8 text-center backdrop-blur-md"
        >
          <Gift className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-4 text-sm leading-relaxed text-primary/75">
            Doa restu Anda adalah karunia yang berarti bagi kami. Namun jika ingin
            memberi tanda kasih, kami menerima dengan penuh syukur.
          </p>

          <div className="mt-6 rounded-sm border border-gold/30 bg-surface p-5">
            <p className="font-label text-[10px] text-primary/50">{settings.bank_name}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="font-serif text-2xl font-semibold tracking-wider text-primary">
                {settings.bank_account_number}
              </span>
              <button
                onClick={copy}
                className="text-accent transition-colors hover:text-primary"
                aria-label="Salin nomor rekening"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-sm text-primary/70">{settings.bank_account_name}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
