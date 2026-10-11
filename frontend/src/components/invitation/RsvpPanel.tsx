"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Check, HelpCircle, Minus, Plus, Send, User, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import { getWishes, submitWish } from "@/lib/api";
import type { Attendance, Wish, WishesResponse } from "@/lib/types";
import { INK, TONES } from "./watercolor";
import { Illustration } from "./WatercolorArt";
import { KnownName, useInvitedGuest } from "./guest";

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  attendance: z.enum(["hadir", "tidak_hadir", "masih_ragu"]),
  guest_count: z.number().int().min(1).max(10),
  message: z.string().max(500, "Maksimal 500 karakter").optional(),
});

type FormValues = z.infer<typeof schema>;

const MAX_GUESTS = 10;
const PAGE_SIZE = 6;

const ATTENDANCE: Record<
  Attendance,
  { label: string; hint: string; icon: typeof Check; tone: keyof typeof TONES }
> = {
  hadir: { label: "Hadir", hint: "Sampai jumpa!", icon: Check, tone: "teal" },
  masih_ragu: { label: "Masih ragu", hint: "Kabari lagi ya", icon: HelpCircle, tone: "butter" },
  tidak_hadir: { label: "Berhalangan", hint: "Doanya saja", icon: X, tone: "coral" },
};

const ORDER: Attendance[] = ["hadir", "masih_ragu", "tidak_hadir"];

/** "3 jam lalu" for recent wishes, a plain date after a week */
function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.round((then - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
  const abs = Math.abs(s);
  if (abs < 60) return "baru saja";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 7 * 86400) return rtf.format(Math.round(s / 86400), "day");
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(then);
}

const label = "font-eyebrow text-[9px] uppercase opacity-60";

/** stationery-style input: a dashed crayon underline instead of a box */
const lineInput =
  "mt-1 w-full border-b-2 border-dashed border-[#2B2522]/55 bg-transparent px-0.5 pb-1.5 pt-1 font-heading text-xl outline-none transition-colors placeholder:text-[#2B2522]/35 focus:border-[#2B2522]";

function ThankYou({ name, attendance, onAgain }: { name: string; attendance: Attendance; onAgain: () => void }) {
  const meta = ATTENDANCE[attendance];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      className="rounded-[14px] crayon-box wc px-5 py-5 text-center"
      style={{ backgroundColor: TONES[meta.tone].bg, boxShadow: `4px 5px 0 0 ${TONES[meta.tone].edge}` }}
    >
      <Illustration name="hello" className="mx-auto h-32 w-auto" />
      <p className="font-heading mt-2 text-2xl leading-tight">Terima kasih, {name}!</p>
      <p className="font-script mt-1 text-xl leading-snug opacity-80">
        {attendance === "hadir"
          ? "Kursimu sudah kami siapkan. Sampai jumpa di hari bahagia kami."
          : attendance === "masih_ragu"
            ? "Semoga bisa datang, kabari kami lagi ya."
            : "Doa dan ucapanmu sudah sangat berarti untuk kami."}
      </p>
      <button
        onClick={onAgain}
        className="mt-3 rounded-full crayon-pill bg-white/80 px-4 py-1.5 font-code text-[11px] transition-transform hover:-translate-y-0.5"
      >
        Kirim konfirmasi lain
      </button>
    </motion.div>
  );
}

function WishNote({ wish, index }: { wish: Wish; index: number }) {
  const meta = ATTENDANCE[wish.attendance] ?? ATTENDANCE.masih_ragu;
  const t = TONES[meta.tone];
  const Icon = meta.icon;
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.05 }}
      className="flex gap-2.5"
    >
      <span
        aria-hidden
        className="font-poster grid h-9 w-9 flex-none place-items-center rounded-full crayon-pill text-base uppercase"
        style={{ backgroundColor: t.bg }}
      >
        {wish.name.trim().charAt(0) || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-heading text-lg leading-tight">{wish.name}</span>
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-code text-[10px]"
            style={{ backgroundColor: t.bg }}
          >
            <Icon className="h-2.5 w-2.5" strokeWidth={3} />
            {meta.label}
            {wish.attendance === "hadir" && wish.guest_count > 1 && ` · ${wish.guest_count}`}
          </span>
          <span className="font-code text-[10px] opacity-50">{timeAgo(wish.created_at)}</span>
        </div>
        {wish.message && (
          <p
            className="relative mt-1 rounded-[12px] rounded-tl-[3px] bg-white/80 px-3 py-2 font-body text-[13px] leading-relaxed"
            style={{ boxShadow: `2px 2px 0 0 ${t.edge}` }}
          >
            {wish.message}
          </p>
        )}
      </div>
    </motion.li>
  );
}

export function RsvpPanel() {
  const guest = useInvitedGuest();
  // a guest from the list doesn't retype their name; "bukan saya?" unlocks it for a forwarded link
  const [nameLocked, setNameLocked] = useState(!!guest);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [meta, setMeta] = useState<Pick<WishesResponse, "total" | "summary"> | null>(null);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sent, setSent] = useState<{ name: string; attendance: Attendance } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: guest?.name ?? "", attendance: "hadir", guest_count: 1, message: "" },
  });
  const attendance = useWatch({ control, name: "attendance" });
  const guests = useWatch({ control, name: "guest_count" });
  const message = useWatch({ control, name: "message" }) ?? "";

  const load = useCallback(
    (p: number) =>
      getWishes(p, PAGE_SIZE).then((res) => {
        setWishes((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
        setMeta({ total: res.total, summary: res.summary });
        setPage(p);
      }),
    []
  );

  useEffect(() => {
    load(1).catch(() => undefined);
  }, [load]);

  const more = async () => {
    setLoadingMore(true);
    await load(page + 1).catch(() => toast.error("Gagal memuat ucapan"));
    setLoadingMore(false);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await submitWish({
        ...values,
        // only people coming bring plus-ones
        guest_count: values.attendance === "hadir" ? values.guest_count : 0,
        message: values.message || "",
        guest_code: nameLocked ? guest?.code : undefined,
      });
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: [TONES.magenta.bg, TONES.butter.bg, TONES.teal.bg, TONES.mauve.bg],
      });
      setSent({ name: values.name.trim().split(" ")[0], attendance: values.attendance });
      reset({ name: nameLocked ? guest?.name : "", attendance: "hadir", guest_count: 1, message: "" });
      load(1).catch(() => undefined);
    } catch {
      toast.error("Gagal mengirim. Silakan coba lagi.");
    }
  };

  return (
    <div className="space-y-5" style={{ color: INK }}>
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <ThankYou key="thanks" {...sent} onAgain={() => setSent(null)} />
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSubmit(onSubmit)}
            className="relative space-y-4 rounded-[14px] crayon-box wc px-4 pb-4 pt-3 sm:px-5"
            style={{ backgroundColor: TONES.cream.bg, boxShadow: `4px 5px 0 0 ${TONES.cream.edge}` }}
          >
            <p className="font-script pr-16 text-2xl leading-snug">
              Bisa datang? Kabari kami, ya.
            </p>
            <Illustration
              name="cafe"
              className="pointer-events-none absolute -top-3 right-2 h-16 w-auto rotate-3"
            />

            {nameLocked && guest ? (
              <KnownName
                labelClass={label}
                name={guest.name}
                onChange={() => {
                  setNameLocked(false);
                  setValue("name", "");
                }}
              />
            ) : (
              <div>
                <label htmlFor="rsvp-name" className={label}>
                  Nama
                </label>
                <input id="rsvp-name" {...register("name")} placeholder="Nama lengkap Anda" className={lineInput} />
                {errors.name && <p className="mt-1 font-code text-[10px] text-[#C0392B]">{errors.name.message}</p>}
              </div>
            )}

            <fieldset>
              <legend className={label}>Kehadiran</legend>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {ORDER.map((key) => {
                  const m = ATTENDANCE[key];
                  const Icon = m.icon;
                  const on = attendance === key;
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setValue("attendance", key)}
                      whileTap={{ scale: 0.95 }}
                      animate={{ y: on ? -3 : 0, rotate: on ? -1.5 : 0, opacity: on ? 1 : 0.6 }}
                      className="flex flex-col items-center gap-0.5 rounded-[12px] crayon-box wc px-1 py-2"
                      style={{
                        backgroundColor: on ? TONES[m.tone].bg : "rgba(255,255,255,0.6)",
                        boxShadow: on ? `3px 4px 0 0 ${TONES[m.tone].edge}` : "none",
                      }}
                    >
                      <span
                        className="grid h-7 w-7 place-items-center rounded-full border-2 border-current"
                        style={{ backgroundColor: on ? "#fff" : "transparent" }}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.6} />
                      </span>
                      <span className="font-poster text-[13px] leading-tight tracking-tight sm:text-sm">{m.label}</span>
                      <span className="font-script text-sm leading-none opacity-70">{m.hint}</span>
                    </motion.button>
                  );
                })}
              </div>
            </fieldset>

            <AnimatePresence initial={false}>
              {attendance === "hadir" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <span className={label}>Jumlah tamu</span>
                  <div className="mt-1.5 flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Kurangi tamu"
                      disabled={guests <= 1}
                      onClick={() => setValue("guest_count", Math.max(1, guests - 1))}
                      className="rounded-full crayon-pill bg-white/80 p-1.5 disabled:opacity-35"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-poster w-8 text-center text-2xl tabular-nums">{guests}</span>
                    <button
                      type="button"
                      aria-label="Tambah tamu"
                      disabled={guests >= MAX_GUESTS}
                      onClick={() => setValue("guest_count", Math.min(MAX_GUESTS, guests + 1))}
                      className="rounded-full crayon-pill bg-white/80 p-1.5 disabled:opacity-35"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="flex min-w-0 items-center gap-0.5 overflow-hidden opacity-70">
                      {Array.from({ length: guests }, (_, i) => (
                        <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <User className="h-4 w-4" />
                        </motion.span>
                      ))}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="rsvp-message" className={label}>
                  Ucapan &amp; doa
                </label>
                <span className="font-code text-[10px] tabular-nums opacity-50">{message.length}/500</span>
              </div>
              <textarea
                id="rsvp-message"
                {...register("message")}
                rows={3}
                maxLength={500}
                placeholder="Tuliskan ucapan untuk kedua mempelai..."
                className="mt-1 w-full resize-none rounded-[10px] crayon-box bg-white/85 px-3 font-script text-xl outline-none placeholder:text-[#2B2522]/35"
                style={{
                  // ruled notebook paper: one line per 30px row
                  lineHeight: "30px",
                  paddingTop: 2,
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 29px, ${TONES.sky.edge} 29px 30px)`,
                  backgroundAttachment: "local",
                }}
              />
              {errors.message && (
                <p className="mt-1 font-code text-[10px] text-[#C0392B]">{errors.message.message}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-2 rounded-full crayon-pill py-2.5 font-poster text-sm tracking-wide disabled:opacity-60"
              style={{
                backgroundColor: TONES.magenta.bg,
                color: TONES.magenta.ink,
                boxShadow: `3px 4px 0 0 ${TONES.magenta.edge}`,
              }}
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Mengirim..." : "Kirim konfirmasi"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-heading text-2xl leading-none">Dinding ucapan</h4>
          {meta && meta.total > 0 && (
            <div className="flex gap-1.5 font-code text-[10px]">
              <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: TONES.teal.bg }}>
                {meta.summary.hadir} hadir
              </span>
              <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: TONES.butter.bg }}>
                {meta.summary.guests} tamu
              </span>
              <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: TONES.mauve.bg }}>
                {meta.total} ucapan
              </span>
            </div>
          )}
        </div>

        {wishes.length === 0 ? (
          <p className="font-script text-2xl opacity-70">Belum ada ucapan. Jadilah yang pertama!</p>
        ) : (
          <>
            <ul className="space-y-3">
              {wishes.map((w, i) => (
                <WishNote key={w.id} wish={w} index={i % PAGE_SIZE} />
              ))}
            </ul>
            {meta && wishes.length < meta.total && (
              <button
                onClick={more}
                disabled={loadingMore}
                className="mx-auto mt-4 block rounded-full crayon-pill bg-white/80 px-4 py-1.5 font-code text-[11px] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loadingMore ? "Memuat..." : `Lihat ucapan lain (${meta.total - wishes.length})`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
