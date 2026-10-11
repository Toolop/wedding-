"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { Check, Copy, ImagePlus, Landmark, LoaderCircle, ReceiptText, Send, Wallet } from "lucide-react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import { submitGiftConfirmation } from "@/lib/api";
import { resizeImage } from "@/lib/resize-image";
import type { GiftAccount, Settings } from "@/lib/types";
import { INK, TONES, type ToneKey } from "./watercolor";
import { GiftBox } from "./WatercolorArt";
import { KnownName, useInvitedGuest } from "./guest";

const CARD_TONES: ToneKey[] = ["sky", "mauve", "teal", "butter", "coral"];
// the hosted API rejects bodies over ~4.5MB; receipts are shrunk well below this first
const MAX_BYTES = 4 * 1024 * 1024;

const label = "font-eyebrow text-[9px] uppercase opacity-60";
const lineInput =
  "mt-1 w-full border-b-2 border-dashed border-[#2B2522]/55 bg-transparent px-0.5 pb-1.5 pt-1 font-heading text-xl outline-none transition-colors placeholder:text-[#2B2522]/35 focus:border-[#2B2522]";

const rupiah = (n: number) => new Intl.NumberFormat("id-ID").format(n);

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
        className="relative mt-2 block h-5 w-7 rounded-[4px] border-2 border-[#2B2522]/60"
        style={{
          backgroundColor: "#F2C66D",
          backgroundImage: "linear-gradient(90deg, transparent 45%, rgba(43,37,34,0.4) 45% 55%, transparent 55%)",
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

function ConfirmForm({ accounts, onDone }: { accounts: GiftAccount[]; onDone: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const guest = useInvitedGuest();
  const [name, setName] = useState(guest?.name ?? "");
  const [nameLocked, setNameLocked] = useState(!!guest);
  const [accountId, setAccountId] = useState<number | null>(accounts.length === 1 ? accounts[0].id : null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (picked?: File) => {
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      toast.error("Bukti harus berupa gambar (JPG/PNG)");
      return;
    }
    const resized = await resizeImage(picked);
    if (resized.size > MAX_BYTES) {
      toast.error("Gambar masih lebih dari 4MB");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(resized);
    setPreview(URL.createObjectURL(resized));
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Isi nama Anda dulu ya");
    if (!file) return setError("Lampirkan bukti transfer");
    setBusy(true);
    try {
      await submitGiftConfirmation({
        name: name.trim(),
        account_id: accountId || undefined,
        amount: Number(amount) || undefined,
        message: message.trim(),
        file,
      });
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.65 },
        colors: [TONES.sky.bg, TONES.butter.bg, TONES.mauve.bg],
      });
      onDone();
    } catch {
      toast.error("Gagal mengirim konfirmasi. Coba lagi ya.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 pt-1">
      {nameLocked && guest ? (
        <KnownName
          labelClass={label}
          name={guest.name}
          onChange={() => {
            setNameLocked(false);
            setName("");
          }}
        />
      ) : (
        <div>
          <label htmlFor="gift-name" className={label}>
            Nama pengirim
          </label>
          <input
            id="gift-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Nama Anda"
            className={lineInput}
          />
        </div>
      )}

      {accounts.length > 1 && (
        <fieldset>
          <legend className={label}>Dikirim ke</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {accounts.map((a, i) => {
              const on = accountId === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setAccountId(on ? null : a.id)}
                  className="rounded-full crayon-pill px-3 py-1 font-code text-[11px] transition"
                  style={{
                    backgroundColor: on ? TONES[CARD_TONES[i % CARD_TONES.length]].bg : "rgba(255,255,255,0.6)",
                    opacity: on ? 1 : 0.7,
                  }}
                >
                  {on && <Check className="mr-1 inline h-3 w-3" />}
                  {a.provider || a.account_number}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="gift-amount" className={label}>
          Nominal <span className="normal-case tracking-normal opacity-70">(opsional)</span>
        </label>
        <div className="mt-1 flex items-baseline gap-1.5 border-b-2 border-dashed border-[#2B2522]/55 pb-1.5 focus-within:border-[#2B2522]">
          <span className="font-heading text-xl opacity-60">Rp</span>
          <input
            id="gift-amount"
            inputMode="numeric"
            value={amount ? rupiah(Number(amount)) : ""}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 13))}
            placeholder="0"
            className="w-full bg-transparent pt-1 font-heading text-xl tabular-nums outline-none placeholder:text-[#2B2522]/35"
          />
        </div>
      </div>

      <div>
        <span className={label}>Bukti transfer</span>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0]);
          }}
          className="mt-1.5 flex w-full items-center gap-3 rounded-[12px] border-2 border-dashed border-[#2B2522]/40 bg-white/60 p-2.5 text-left transition-colors hover:bg-white"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Bukti transfer" className="h-16 w-16 flex-none rounded-[6px] object-cover" />
          ) : (
            <span className="grid h-16 w-16 flex-none place-items-center rounded-[6px] bg-white/80">
              <ImagePlus className="h-6 w-6 opacity-60" />
            </span>
          )}
          <span className="min-w-0">
            <span className="font-heading block truncate text-lg leading-tight">
              {file ? "Bukti terlampir" : "Pilih foto / tangkapan layar"}
            </span>
            <span className="font-code block text-[10px] opacity-60">
              {file ? "Ketuk untuk mengganti" : "JPG atau PNG, maks. 4MB"}
            </span>
          </span>
        </button>
      </div>

      <div>
        <label htmlFor="gift-message" className={label}>
          Pesan <span className="normal-case tracking-normal opacity-70">(opsional)</span>
        </label>
        <input
          id="gift-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          placeholder="Selamat menempuh hidup baru!"
          className={lineInput}
        />
      </div>

      {error && <p className="font-code text-[11px] text-[#C0392B]">{error}</p>}

      <motion.button
        type="submit"
        disabled={busy}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="flex w-full items-center justify-center gap-2 rounded-full crayon-pill py-2.5 font-poster text-sm tracking-wide disabled:opacity-60"
        style={{ backgroundColor: TONES.magenta.bg, color: TONES.magenta.ink, boxShadow: `3px 4px 0 0 ${TONES.magenta.edge}` }}
      >
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {busy ? "Mengirim..." : "Kirim konfirmasi"}
      </motion.button>
    </form>
  );
}

export function GiftPanel({ settings, gifts }: { settings: Settings; gifts?: GiftAccount[] }) {
  const accounts = accountsFrom(settings, gifts);
  const [stage, setStage] = useState<"closed" | "open" | "done">("closed");

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
        <>
          <div className="space-y-3">
            {accounts.map((a, i) => (
              <AccountCard key={a.id} account={a} index={i} />
            ))}
          </div>

          <div
            className="rounded-[14px] crayon-box wc px-4 py-3"
            style={{ backgroundColor: TONES.cream.bg, boxShadow: `4px 5px 0 0 ${TONES.cream.edge}` }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {stage === "done" ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 py-1"
                >
                  <GiftBox className="h-14 w-auto flex-none" />
                  <div>
                    <p className="font-heading text-xl leading-tight">Terima kasih banyak!</p>
                    <p className="font-script text-lg leading-snug opacity-80">
                      Konfirmasimu sudah kami terima dan akan segera kami cek.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="form" exit={{ opacity: 0 }}>
                  <button
                    type="button"
                    onClick={() => setStage(stage === "open" ? "closed" : "open")}
                    aria-expanded={stage === "open"}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-full crayon-pill bg-white/80">
                      <ReceiptText className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-heading block text-xl leading-tight">Sudah mengirim hadiah?</span>
                      <span className="font-code block text-[11px] opacity-60">
                        Konfirmasi dengan mengunggah bukti transfer
                      </span>
                    </span>
                    <motion.span animate={{ rotate: stage === "open" ? 45 : 0 }} className="font-poster text-2xl leading-none">
                      +
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {stage === "open" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="crayon-rule-t mt-3 pt-3">
                          <ConfirmForm accounts={accounts} onDone={() => setStage("done")} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
