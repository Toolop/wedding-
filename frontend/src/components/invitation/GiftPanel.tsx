"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check, Copy, Landmark, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import type { GiftAccount, Settings } from "@/lib/types";
import { INK, TONES, type ToneKey } from "./watercolor";
import { GiftBox } from "./WatercolorArt";

const CARD_TONES: ToneKey[] = ["sky", "mauve", "teal", "butter", "coral"];
/** older backends only have the single bank account on settings */
function accountsFrom(settings: Settings, gifts?: GiftAccount[]): GiftAccount[] {
  if (gifts?.length) return gifts;
  if (!settings.bank_account_number) return [];
  return [
    {
      id: 0,
      kind: "bank",
      provider: settings.bank_name,
      account_number: settings.bank_account_number,
      account_name: settings.bank_account_name,
      sort_order: 1,
    },
  ];
}

function AccountCard({ account, index }: { account: GiftAccount; index: number }) {
  const t = TONES[CARD_TONES[index % CARD_TONES.length]];
  const [copied, setCopied] = useState(false);
  const Icon = account.kind === "ewallet" ? Wallet : Landmark;

  const copy = async () => {
    try {
      // copy digits only so banking apps accept the paste
      await navigator.clipboard.writeText(account.account_number.replace(/[\s.-]/g, ""));
      setCopied(true);
      toast.success("Nomor disalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin, silakan salin manual");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, rotate: index % 2 ? 1.5 : -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: index % 2 ? 0.6 : -0.6 }}
      transition={{ delay: 0.06 + index * 0.08, type: "spring", stiffness: 200, damping: 20 }}
      className="relative overflow-hidden rounded-[16px] crayon-box wc px-4 pb-3.5 pt-3"
      style={{ backgroundColor: t.bg, color: t.ink, boxShadow: `4px 5px 0 0 ${t.edge}` }}
    >
      {/* soft paint swirl, like the shine on a card */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full opacity-40 blur-xl"
        style={{ backgroundColor: "#fff" }}
      />
      <div className="relative flex items-center justify-between gap-2">
        <span className="font-poster truncate text-xl leading-tight">{account.provider || "Rekening"}</span>
        <span className="inline-flex flex-none items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 font-code text-[10px]">
          <Icon className="h-3 w-3" />
          {account.kind === "ewallet" ? "E-wallet" : "Bank"}
        </span>
      </div>

      {/* the little chip, drawn in crayon */}
      <span
        aria-hidden
        className="relative mt-2 block h-5 w-7 rounded-[4px] border-2 border-[#2F3D35]/60"
        style={{
          backgroundColor: "#E6CF8A",
          backgroundImage: "linear-gradient(90deg, transparent 45%, rgba(47,61,53,0.4) 45% 55%, transparent 55%)",
        }}
      />

      <div className="relative mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-code break-all text-[22px] leading-tight tracking-wider tabular-nums">
            {account.account_number}
          </p>
          {account.account_name && (
            <p className="font-heading mt-0.5 truncate text-base opacity-80">a.n. {account.account_name}</p>
          )}
        </div>
        <motion.button
          onClick={copy}
          whileTap={{ scale: 0.92 }}
          className="inline-flex flex-none items-center gap-1.5 rounded-full crayon-pill bg-white/85 px-3 py-1.5 font-code text-[11px]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Tersalin" : "Salin"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export function GiftPanel({ settings, gifts }: { settings: Settings; gifts?: GiftAccount[] }) {
  const accounts = accountsFrom(settings, gifts);

  return (
    <div className="space-y-4" style={{ color: INK }}>
      <p className="font-script text-2xl leading-snug">
        Kehadiran dan doa restu Anda sudah lebih dari cukup. Namun bila ingin memberi tanda kasih:
      </p>

      {accounts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[14px] crayon-box wc px-4 py-3" style={{ backgroundColor: TONES.sky.bg }}>
          <GiftBox className="h-12 w-auto flex-none" />
          <p className="font-heading text-lg leading-snug">Info rekening menyusul ya.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((a, i) => (
            <AccountCard key={a.id} account={a} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
