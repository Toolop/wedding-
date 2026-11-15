"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, HelpCircle, ImagePlus, Minus, Plus, Send, User, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import { getWishes, mediaUrl, submitWish } from "@/lib/api";
import { resizeImage } from "@/lib/resize-image";
import type { Attendance, Wish, WishesResponse } from "@/lib/types";
import { colors, readColor, TONES } from "./theme";
import { DoubleFrame, Eyebrow, Ornament } from "./classy";
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
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const ATTENDANCE: Record<
  Attendance,
  { label: string; hint: string; icon: typeof Check; tone: keyof typeof TONES }
> = {
  hadir: { label: "Hadir", hint: "Sampai jumpa!", icon: Check, tone: "seafoam" },
  masih_ragu: { label: "Masih ragu", hint: "Kabari lagi ya", icon: HelpCircle, tone: "butter" },
  tidak_hadir: { label: "Berhalangan", hint: "Doanya saja", icon: X, tone: "rose" },
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

const label = "font-eyebrow block text-[10px] uppercase tracking-[0.28em] text-gold-ink";

/** stationery-style input: a hairline underline instead of a box */
const lineInput =
  "mt-1 w-full border-b border-line bg-transparent px-0.5 pb-2 pt-1 font-serif text-2xl font-medium outline-none transition-colors placeholder:font-normal placeholder:italic placeholder:text-stone focus:border-brand";

function ThankYou({ name, attendance, onAgain }: { name: string; attendance: Attendance; onAgain: () => void }) {
  const meta = ATTENDANCE[attendance];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <DoubleFrame innerClassName="px-5 py-7 text-center">
        <Eyebrow className="justify-center">{meta.label}</Eyebrow>
        <p className="mt-2 font-serif text-3xl font-medium leading-tight">Terima kasih, {name}</p>
        <Ornament className="my-3" />
        <p className="font-script text-xl leading-snug text-muted">
          {attendance === "hadir"
            ? "Kursi Anda sudah kami siapkan. Sampai jumpa di hari bahagia kami."
            : attendance === "masih_ragu"
              ? "Semoga bisa datang, kabari kami lagi ya."
              : "Doa dan ucapan Anda sudah sangat berarti untuk kami."}
        </p>
        <button
          onClick={onAgain}
          className="mt-4 inline-flex min-h-11 items-center rounded-full border border-line bg-paper px-5 font-code text-[13px] transition-colors hover:border-gold"
        >
          Kirim konfirmasi lain
        </button>
      </DoubleFrame>
    </motion.div>
  );
}

function WishNote({ wish, index }: { wish: Wish; index: number }) {
  const meta = ATTENDANCE[wish.attendance] ?? ATTENDANCE.masih_ragu;
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-3 border-b border-line-soft pb-4 last:border-0"
    >
      <span
        aria-hidden
        className="grid h-10 w-10 flex-none place-items-center rounded-full border border-gold font-serif text-lg font-semibold uppercase text-brand"
      >
        {wish.name.trim().charAt(0) || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="font-serif text-xl font-semibold leading-tight">{wish.name}</span>
          <span className="font-eyebrow text-[9px] uppercase tracking-[0.2em] text-gold-ink">
            {meta.label}
            {wish.attendance === "hadir" && wish.guest_count > 1 && ` · ${wish.guest_count} tamu`}
          </span>
        </div>
        {wish.message && <p className="mt-1 font-script text-lg leading-snug text-ink/85">{wish.message}</p>}
        {wish.photo_url && <WishPhoto src={mediaUrl(wish.photo_url)} name={wish.name} />}
        <p className="mt-1 font-code text-[11px] text-muted">{timeAgo(wish.created_at)}</p>
      </div>
    </motion.li>
  );
}

/** a small tilted polaroid on the wish; tap for the full photo */
function WishPhoto({ src, name }: { src: string; name: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Lihat foto dari ${name}`}
        className="mt-2 block rounded-[4px] bg-white p-1.5 pb-4 shadow-paint-sm transition-transform "
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`Foto dari ${name}`} loading="lazy" className="h-28 w-auto max-w-[11rem] rounded-[2px] object-cover" />
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[100] grid place-items-center bg-ink/80 p-4"
              >
                <motion.figure
                  initial={{ scale: 0.9}}
                  animate={{ scale: 1}}
                  exit={{ scale: 0.9 }}
                  className="rounded-[6px] bg-white p-2 pb-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Foto dari ${name}`} className="max-h-[78vh] max-w-[88vw] rounded-[3px] object-contain" />
                  <figcaption className="font-script mt-1 text-center text-xl" style={{ color: colors.ink }}>
                    dari {name}
                  </figcaption>
                </motion.figure>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
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
  const photoInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const pickPhoto = async (picked?: File) => {
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      toast.error("Foto harus berupa gambar (JPG/PNG)");
      return;
    }
    const resized = await resizeImage(picked);
    if (resized.size > MAX_PHOTO_BYTES) {
      toast.error("Foto masih lebih dari 4MB");
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(resized);
    setPhotoPreview(URL.createObjectURL(resized));
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview("");
  };

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
        photo,
      });
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: [TONES.brand.bg, TONES.butter.bg, TONES.seafoam.bg, TONES.sage.bg].map(readColor), // canvas needs literal colours
      });
      setSent({ name: values.name.trim().split(" ")[0], attendance: values.attendance });
      reset({ name: nameLocked ? guest?.name : "", attendance: "hadir", guest_count: 1, message: "" });
      clearPhoto();
      load(1).catch(() => undefined);
    } catch {
      toast.error("Gagal mengirim. Silakan coba lagi.");
    }
  };

  return (
    <div className="space-y-5" style={{ color: colors.ink }}>
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
            className="relative space-y-6 rounded-[6px] border border-line bg-paper px-5 pb-5 pt-6 shadow-paint-sm sm:px-6"
          >
            <div className="text-center">
              <p className="font-serif text-[1.7rem] font-medium leading-tight">Konfirmasi Kehadiran</p>
              <p className="font-script mt-0.5 text-lg text-muted">Bisa datang? Kabari kami, ya.</p>
              <Ornament className="mt-3" />
            </div>

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
                {errors.name && <p className="font-code field-error">{errors.name.message}</p>}
              </div>
            )}

            <fieldset>
              <legend className={label}>Kehadiran</legend>
              <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-[4px] border border-line">
                {ORDER.map((key, i) => {
                  const m = ATTENDANCE[key];
                  const Icon = m.icon;
                  const on = attendance === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setValue("attendance", key)}
                      className={`flex min-h-[76px] flex-col items-center justify-center gap-1 px-1 py-2.5 transition-colors duration-300 ${
                        i ? "border-l border-line" : ""
                      } ${on ? "bg-brand text-on-brand" : "bg-page text-ink hover:bg-chrome"}`}
                    >
                      <Icon className={`h-4 w-4 ${on ? "text-honey" : "text-gold-ink"}`} strokeWidth={1.5} />
                      <span className="font-serif text-base font-semibold leading-tight">{m.label}</span>
                      <span className={`font-script text-sm leading-none ${on ? "text-on-brand-muted" : "text-muted"}`}>{m.hint}</span>
                    </button>
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
                  <div className="mt-2 flex items-center gap-4">
                    <button
                      type="button"
                      aria-label="Kurangi tamu"
                      disabled={guests <= 1}
                      onClick={() => setValue("guest_count", Math.max(1, guests - 1))}
                      className="grid h-11 w-11 place-items-center rounded-full border border-line bg-paper text-brand transition-colors hover:border-gold disabled:opacity-35"
                    >
                      <Minus className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <span className="w-8 text-center font-serif text-3xl font-medium tabular-nums text-brand">{guests}</span>
                    <button
                      type="button"
                      aria-label="Tambah tamu"
                      disabled={guests >= MAX_GUESTS}
                      onClick={() => setValue("guest_count", Math.min(MAX_GUESTS, guests + 1))}
                      className="grid h-11 w-11 place-items-center rounded-full border border-line bg-paper text-brand transition-colors hover:border-gold disabled:opacity-35"
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <span className="flex min-w-0 items-center gap-0.5 overflow-hidden text-gold-ink">
                      {Array.from({ length: guests }, (_, i) => (
                        <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <User className="h-4 w-4" strokeWidth={1.5} />
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
                <span className="font-code text-[11px] tabular-nums text-muted">{message.length}/500</span>
              </div>
              <textarea
                id="rsvp-message"
                {...register("message")}
                rows={4}
                maxLength={500}
                placeholder="Tuliskan ucapan untuk kedua mempelai..."
                className="mt-2 w-full resize-none rounded-[4px] border border-line bg-page px-3.5 py-3 font-script text-xl leading-snug outline-none transition-colors placeholder:text-stone focus:border-brand"
              />
              {errors.message && (
                <p className="font-code field-error">{errors.message.message}</p>
              )}
            </div>

            <div>
              <span className={label}>
                Foto <span className="normal-case tracking-normal text-muted">(opsional)</span>
              </span>
              <input
                ref={photoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  pickPhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <div className="relative mt-2">
                <button
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    pickPhoto(e.dataTransfer.files?.[0]);
                  }}
                  className="flex w-full items-center gap-3.5 rounded-[4px] border border-line bg-page p-3 pr-10 text-left transition-colors hover:border-gold"
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Foto terpilih" className="h-14 w-14 flex-none rounded-full border border-gold-soft object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 flex-none place-items-center rounded-full border border-gold-soft bg-paper">
                      <ImagePlus className="h-5 w-5 text-gold-ink" strokeWidth={1.4} />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-lg font-semibold leading-tight">
                      {photo ? "Foto terlampir" : "Tambahkan satu foto"}
                    </span>
                    <span className="font-code block text-xs text-muted">
                      {photo ? "Ketuk untuk mengganti" : "Muncul di dinding ucapan · maks. 4MB"}
                    </span>
                  </span>
                </button>
                {photo && (
                  <button
                    type="button"
                    aria-label="Hapus foto"
                    onClick={clearPhoto}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-[5px] border border-line bg-paper p-[5px]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-[3px] border border-gold-soft bg-brand text-on-brand transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                <Send className="h-4 w-4 text-honey" strokeWidth={1.4} />
                <span className="font-serif text-[1.35rem] font-medium italic leading-none">
                  {isSubmitting ? "Mengirim…" : "Kirim Konfirmasi"}
                </span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <section>
        <div className="mb-5 flex flex-col items-center gap-1 text-center">
          <h4 className="font-serif text-[1.7rem] font-medium leading-none">Dinding Ucapan</h4>
          {meta && meta.total > 0 && (
            <p className="font-eyebrow mt-1 text-[10px] uppercase tracking-[0.22em] text-gold-ink">
              {meta.summary.hadir} hadir · {meta.summary.guests} tamu · {meta.total} ucapan
            </p>
          )}
          <Ornament className="mt-2" />
        </div>

        {wishes.length === 0 ? (
          <p className="font-script text-center text-2xl text-muted">Belum ada ucapan. Jadilah yang pertama.</p>
        ) : (
          <>
            <ul className="space-y-4">
              {wishes.map((w, i) => (
                <WishNote key={w.id} wish={w} index={i % PAGE_SIZE} />
              ))}
            </ul>
            {meta && wishes.length < meta.total && (
              <button
                onClick={more}
                disabled={loadingMore}
                className="mx-auto mt-5 flex min-h-11 items-center rounded-full border border-line bg-paper px-5 font-code text-[13px] transition-colors hover:border-gold disabled:opacity-60"
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
