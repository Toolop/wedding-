"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  HelpCircle,
  Instagram,
  MapPin,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import { getWishes, mediaUrl, submitWish } from "@/lib/api";
import type { GalleryImage, Settings, StoryEvent, Wish } from "@/lib/types";
import { usePortalRoot } from "../ThemeProvider";
import { INK, PAPER, TONES } from "./floTone";
import { HeartArt, RingsArt } from "./HeroDoodles";

/* ------------------------------------------------------------ primitives */

/** dashed label + value line, the standard row inside every pop-up */
export function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-dashed border-current/25 py-1.5 last:border-0">
      <span className="font-eyebrow text-[9px] uppercase opacity-60">{label}</span>
      <span className="font-heading text-lg leading-snug">{value}</span>
    </div>
  );
}

/** small sticker-style block, reused for countdown digits and stats */
function Chip({
  value,
  label,
  tone = "butter",
}: {
  value: string;
  label: string;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <div
      className="flex min-w-[58px] flex-col items-center rounded-[10px] border-[2.5px] px-2 py-1.5"
      style={{ background: t.bg, borderColor: t.edge, color: t.ink, boxShadow: `3px 3px 0 0 ${t.edge}` }}
    >
      <span className="font-code text-xl leading-none tabular-nums">{value}</span>
      <span className="font-eyebrow mt-1 text-[8px] uppercase opacity-70">{label}</span>
    </div>
  );
}

/** outline link button in the crayon language */
function LinkPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 font-code text-[11px] transition-transform hover:-translate-y-0.5"
      style={{ borderColor: INK, color: INK }}
    >
      {children}
    </a>
  );
}

function parseDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatLongDate(value: string) {
  const d = parseDate(value);
  if (!d) return value;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/* ---------------------------------------------------------- 1. the date */

export function DatePanel({ settings }: { settings: Settings }) {
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(
    null
  );

  useEffect(() => {
    const date = parseDate(settings.wedding_date);
    if (!date) return;
    const tick = () => {
      const diff = Math.max(0, date.getTime() - Date.now());
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor(diff / 3600000) % 24,
        m: Math.floor(diff / 60000) % 60,
        s: Math.floor(diff / 1000) % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings.wedding_date]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="space-y-4">
      <p className="font-heading text-2xl leading-snug">
        {formatLongDate(settings.wedding_date)}
      </p>

      <div className="flex flex-wrap gap-2">
        <Chip value={left ? String(left.d) : "--"} label="hari" tone="mauve" />
        <Chip value={left ? pad(left.h) : "--"} label="jam" tone="butter" />
        <Chip value={left ? pad(left.m) : "--"} label="menit" tone="teal" />
        <Chip value={left ? pad(left.s) : "--"} label="detik" tone="coral" />
      </div>

      <p className="font-script text-2xl leading-snug opacity-85">
        Satu hari yang kami tunggu sejak lama — dan kami ingin Anda ada di dalamnya.
      </p>

      {settings.quote && (
        <div
          className="rounded-[12px] border-[2.5px] px-4 py-3"
          style={{ borderColor: TONES.cream.edge, background: TONES.cream.bg, color: TONES.cream.ink }}
        >
          <p className="font-script text-2xl leading-snug">“{settings.quote}”</p>
          {settings.quote_author && (
            <p className="font-eyebrow mt-2 text-[9px] uppercase opacity-60">
              {settings.quote_author}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------- 2. ceremony details */

function EventBlock({
  kicker,
  date,
  time,
  location,
  address,
  maps,
  tone,
}: {
  kicker: string;
  date: string;
  time: string;
  location: string;
  address: string;
  maps: string;
  tone: keyof typeof TONES;
}) {
  const t = TONES[tone];
  if (!date && !time && !location) return null;
  return (
    <div
      className="rounded-[12px] border-[2.5px] px-4 py-3"
      style={{ background: t.bg, borderColor: t.edge, color: t.ink, boxShadow: `4px 4px 0 0 ${t.edge}` }}
    >
      <p className="font-poster text-sm uppercase tracking-wide">{kicker}</p>
      <InfoRow label="Waktu" value={[date, time].filter(Boolean).join(" · ")} />
      <InfoRow label="Tempat" value={location} />
      <InfoRow label="Alamat" value={address} />
      {maps && (
        <a
          href={maps}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-current px-3 py-1.5 font-code text-[11px] transition-transform hover:-translate-y-0.5"
        >
          <MapPin className="h-3.5 w-3.5" /> Lihat peta
        </a>
      )}
    </div>
  );
}

export function CeremonyPanel({ settings }: { settings: Settings }) {
  return (
    <div className="space-y-3">
      <EventBlock
        kicker="Akad Nikah"
        date={settings.akad_date}
        time={settings.akad_time}
        location={settings.akad_location}
        address={settings.akad_address}
        maps={settings.akad_maps_url}
        tone="cream"
      />
      <EventBlock
        kicker="Resepsi"
        date={settings.resepsi_date}
        time={settings.resepsi_time}
        location={settings.resepsi_location}
        address={settings.resepsi_address}
        maps={settings.resepsi_maps_url}
        tone="sky"
      />
      <p className="font-script text-2xl leading-snug opacity-80">
        Mohon hadir sedikit lebih awal agar tidak melewatkan momen pentingnya.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------- 3. registry */

export function RegistryPanel({ settings }: { settings: Settings }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(settings.bank_account_number);
      setCopied(true);
      toast.success("Nomor rekening disalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin, silakan salin manual");
    }
  };

  return (
    <div className="space-y-3">
      <p className="font-script text-2xl leading-snug">
        Kehadiran Anda sudah lebih dari cukup. Namun bila ingin memberi tanda kasih:
      </p>
      <div
        className="rounded-[12px] border-[2.5px] px-4 py-3"
        style={{
          background: TONES.sky.bg,
          borderColor: TONES.sky.edge,
          color: TONES.sky.ink,
          boxShadow: `4px 4px 0 0 ${TONES.sky.edge}`,
        }}
      >
        <InfoRow label="Bank" value={settings.bank_name} />
        <InfoRow label="Atas nama" value={settings.bank_account_name} />
        <InfoRow label="Nomor rekening" value={settings.bank_account_number} />
        {settings.bank_account_number && (
          <button
            onClick={copy}
            className="mt-2 inline-flex items-center gap-2 rounded-full border-2 border-current px-4 py-2 font-code text-xs transition-transform hover:-translate-y-0.5"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Tersalin" : "Salin nomor"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- 4. gallery */

export function GalleryPanel({ gallery }: { gallery: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const portalRoot = usePortalRoot();

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: number) =>
      setOpenIndex((i) =>
        i === null ? null : (i + dir + gallery.length) % gallery.length
      ),
    [gallery.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [openIndex, close, step]);

  if (gallery.length === 0) {
    return (
      <p className="font-script text-2xl leading-snug opacity-80">
        Galeri sedang kami siapkan. Nanti kembali lagi, ya.
      </p>
    );
  }

  return (
    <>
      <p className="font-script mb-3 text-2xl leading-snug opacity-85">
        Momen yang kami kumpulkan pelan-pelan — klik untuk memperbesar.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {gallery.map((img, i) => (
          <motion.button
            key={img.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i, 8) * 0.04 }}
            onClick={() => setOpenIndex(i)}
            className="group relative overflow-hidden rounded-[10px] border-[2.5px]"
            style={{ borderColor: INK, boxShadow: `3px 3px 0 0 ${TONES.teal.edge}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(img.image_url)}
              alt={img.caption || "Galeri"}
              className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </motion.button>
        ))}
      </div>

      {/* portalled: the pop-up is transformed, which would trap a fixed overlay inside it */}
      {portalRoot &&
        createPortal(
          <AnimatePresence>
            {openIndex !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1F2933]/80 p-4"
                onClick={close}
              >
                <motion.div
                  initial={{ scale: 0.88, rotate: -1.5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-h-[86vh] w-full max-w-xl overflow-hidden rounded-[14px] border-[3px]"
                  style={{ borderColor: INK, background: PAPER, boxShadow: "8px 10px 0 0 rgba(31,41,51,0.4)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(gallery[openIndex].image_url)}
                    alt={gallery[openIndex].caption || "Galeri"}
                    className="max-h-[70vh] w-full object-contain"
                  />
                  {gallery[openIndex].caption && (
                    <p
                      className="border-t-[3px] px-4 py-2 font-heading text-lg"
                      style={{ borderColor: INK, color: INK }}
                    >
                      {gallery[openIndex].caption}
                    </p>
                  )}
                  <button
                    onClick={close}
                    aria-label="Tutup foto"
                    className="absolute right-2 top-2 rounded-full border-2 bg-white/85 p-1 transition-transform hover:rotate-90"
                    style={{ borderColor: INK, color: INK }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {gallery.length > 1 && (
                    <>
                      <button
                        onClick={() => step(-1)}
                        aria-label="Foto sebelumnya"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border-2 bg-white/85 p-1.5"
                        style={{ borderColor: INK, color: INK }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => step(1)}
                        aria-label="Foto berikutnya"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border-2 bg-white/85 p-1.5"
                        style={{ borderColor: INK, color: INK }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          portalRoot
        )}
    </>
  );
}

/* ------------------------------------------------------------- 5. story */

const STORY_TONES: (keyof typeof TONES)[] = ["coral", "butter", "teal", "mauve", "sky"];

export function StoryPanel({ story }: { story: StoryEvent[] }) {
  if (story.length === 0) {
    return (
      <p className="font-script text-2xl leading-snug opacity-80">
        Kisah kami masih ditulis — babnya menyusul.
      </p>
    );
  }

  return (
    <div className="relative pl-6">
      <span
        className="absolute left-[9px] top-2 h-[calc(100%-1rem)] w-[2px]"
        style={{ backgroundImage: `repeating-linear-gradient(to bottom, ${INK} 0 6px, transparent 6px 12px)` }}
      />
      <div className="space-y-4">
        {story.map((item, i) => {
          const t = TONES[STORY_TONES[i % STORY_TONES.length]];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i }}
              className="relative"
            >
              <span
                className="absolute -left-6 top-2 h-3.5 w-3.5 rounded-full border-[2.5px]"
                style={{ background: t.bg, borderColor: INK }}
              />
              <div
                className="rounded-[12px] border-[2.5px] px-4 py-3"
                style={{ background: t.bg, borderColor: t.edge, color: t.ink, boxShadow: `4px 4px 0 0 ${t.edge}` }}
              >
                <span className="font-eyebrow text-[9px] uppercase opacity-70">
                  {item.event_date}
                </span>
                <h4 className="font-heading text-xl leading-tight">{item.title}</h4>
                {item.description && (
                  <p className="mt-1 font-body text-sm leading-relaxed opacity-85">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 6. couple */

function Person({
  role,
  name,
  full,
  parents,
  instagram,
  image,
  tone,
}: {
  role: string;
  name: string;
  full: string;
  parents: string;
  instagram: string;
  image: string;
  tone: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <div
      className="flex-1 rounded-[12px] border-[2.5px] p-3 text-center"
      style={{ background: t.bg, borderColor: t.edge, color: t.ink, boxShadow: `4px 4px 0 0 ${t.edge}` }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(image)}
          alt={name}
          className="mx-auto aspect-square w-24 rounded-full border-[2.5px] object-cover"
          style={{ borderColor: INK }}
        />
      ) : (
        <div className="mx-auto grid aspect-square w-24 place-items-center rounded-full border-[2.5px]" style={{ borderColor: INK }}>
          <HeartArt className="h-10 w-auto" />
        </div>
      )}
      <p className="font-eyebrow mt-2 text-[9px] uppercase opacity-70">{role}</p>
      <h4 className="font-heading text-2xl leading-tight">{full || name}</h4>
      {parents && <p className="mt-1 font-body text-xs leading-relaxed opacity-80">{parents}</p>}
      {instagram && (
        <a
          href={`https://instagram.com/${instagram.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 rounded-full border-2 border-current px-3 py-1 font-code text-[10px]"
        >
          <Instagram className="h-3 w-3" />@{instagram.replace("@", "")}
        </a>
      )}
    </div>
  );
}

export function CouplePanel({ settings }: { settings: Settings }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Person
          role="Mempelai Pria"
          name={settings.groom_name}
          full={settings.groom_full_name}
          parents={settings.groom_parents}
          instagram={settings.groom_instagram}
          image={settings.couple_image}
          tone="sky"
        />
        <Person
          role="Mempelai Wanita"
          name={settings.bride_name}
          full={settings.bride_full_name}
          parents={settings.bride_parents}
          instagram={settings.bride_instagram}
          image={settings.hero_image}
          tone="mauve"
        />
      </div>
      <div className="flex items-center justify-center gap-2 opacity-70" style={{ color: INK }}>
        <RingsArt className="h-8 w-auto" />
        <span className="font-script text-2xl">bersama, mulai hari itu</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- 7. guest list */

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  attendance: z.enum(["hadir", "tidak_hadir", "masih_ragu"]),
  guest_count: z.coerce.number().min(1).max(10),
  message: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

const ATTENDANCE_META = {
  hadir: { label: "Hadir", icon: CheckCircle2, tone: "teal" as const },
  tidak_hadir: { label: "Tidak Hadir", icon: XCircle, tone: "coral" as const },
  masih_ragu: { label: "Masih Ragu", icon: HelpCircle, tone: "butter" as const },
};

const fieldClass =
  "mt-1 w-full rounded-[10px] border-[2.5px] bg-white/80 px-3 py-2 font-body text-sm outline-none transition-colors focus:bg-white";

export function GuestPanel() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [refresh, setRefresh] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { attendance: "hadir", guest_count: 1, message: "" },
  });

  useEffect(() => {
    getWishes(1, 8)
      .then((res) => setWishes(res.items))
      .catch(() => undefined);
  }, [refresh]);

  const onSubmit = async (values: FormValues) => {
    try {
      await submitWish({ ...values, message: values.message || "" });
      toast.success("Terima kasih! Konfirmasi Anda telah terkirim.");
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: [TONES.magenta.bg, TONES.butter.bg, TONES.teal.bg],
      });
      reset();
      setRefresh((k) => k + 1);
    } catch {
      toast.error("Gagal mengirim. Silakan coba lagi.");
    }
  };

  return (
    <div className="space-y-4" style={{ color: INK }}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-2.5 rounded-[12px] border-[2.5px] px-4 py-3"
        style={{
          background: TONES.cream.bg,
          borderColor: TONES.cream.edge,
          boxShadow: `4px 4px 0 0 ${TONES.cream.edge}`,
        }}
      >
        <div>
          <label className="font-eyebrow text-[9px] uppercase opacity-60">Nama</label>
          <input
            {...register("name")}
            placeholder="Nama lengkap Anda"
            className={fieldClass}
            style={{ borderColor: INK }}
          />
          {errors.name && (
            <p className="mt-1 font-code text-[10px] text-[#C0392B]">{errors.name.message}</p>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="font-eyebrow text-[9px] uppercase opacity-60">Kehadiran</label>
            <select {...register("attendance")} className={fieldClass} style={{ borderColor: INK }}>
              <option value="hadir">Hadir</option>
              <option value="tidak_hadir">Tidak Hadir</option>
              <option value="masih_ragu">Masih Ragu</option>
            </select>
          </div>
          <div className="w-24">
            <label className="font-eyebrow text-[9px] uppercase opacity-60">Tamu</label>
            <input
              type="number"
              min={1}
              max={10}
              {...register("guest_count")}
              className={fieldClass}
              style={{ borderColor: INK }}
            />
          </div>
        </div>

        <div>
          <label className="font-eyebrow text-[9px] uppercase opacity-60">Ucapan &amp; doa</label>
          <textarea
            {...register("message")}
            rows={3}
            placeholder="Tuliskan ucapan untuk kedua mempelai..."
            className={`${fieldClass} resize-none`}
            style={{ borderColor: INK }}
          />
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border-[2.5px] py-2.5 font-poster text-sm disabled:opacity-60"
          style={{
            background: TONES.magenta.bg,
            borderColor: TONES.magenta.edge,
            color: TONES.magenta.ink,
            boxShadow: `4px 4px 0 0 ${TONES.magenta.edge}`,
          }}
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Mengirim..." : "KIRIM KONFIRMASI"}
        </motion.button>
      </form>

      <div>
        <p className="font-eyebrow mb-2 text-[9px] uppercase opacity-60">
          Ucapan yang masuk
        </p>
        {wishes.length === 0 ? (
          <p className="font-script text-2xl opacity-70">
            Belum ada ucapan. Jadilah yang pertama!
          </p>
        ) : (
          <div className="space-y-2">
            {wishes.map((w) => {
              const meta = ATTENDANCE_META[w.attendance] ?? ATTENDANCE_META.masih_ragu;
              const t = TONES[meta.tone];
              const Icon = meta.icon;
              return (
                <div
                  key={w.id}
                  className="rounded-[10px] border-[2.5px] px-3 py-2"
                  style={{ background: t.bg, borderColor: t.edge, color: t.ink }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-lg leading-none">{w.name}</span>
                    <span className="inline-flex items-center gap-1 font-code text-[10px] opacity-75">
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </div>
                  {w.message && (
                    <p className="mt-1 font-body text-xs leading-relaxed opacity-85">
                      {w.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- 8. contact us */

export function ContactPanel({ settings }: { settings: Settings }) {
  const wa = (name: string) =>
    name ? `https://wa.me/?text=${encodeURIComponent(`Halo ${name}, selamat ya!`)}` : "";
  return (
    <div className="space-y-3" style={{ color: INK }}>
      <p className="font-script text-2xl leading-snug">
        Ada yang ingin ditanyakan soal acara? Sapa kami lewat kanal ini.
      </p>
      <div
        className="rounded-[12px] border-[2.5px] px-4 py-3"
        style={{ background: TONES.teal.bg, borderColor: TONES.teal.edge, color: TONES.teal.ink }}
      >
        <InfoRow label="Mempelai" value={`${settings.groom_name} & ${settings.bride_name}`} />
        <InfoRow label="Lokasi utama" value={settings.resepsi_location || settings.akad_location} />
        <div className="mt-2 flex flex-wrap gap-2">
          {settings.groom_instagram && (
            <LinkPill href={`https://instagram.com/${settings.groom_instagram.replace("@", "")}`}>
              <Instagram className="h-3.5 w-3.5" /> {settings.groom_instagram}
            </LinkPill>
          )}
          {settings.bride_instagram && (
            <LinkPill href={`https://instagram.com/${settings.bride_instagram.replace("@", "")}`}>
              <Instagram className="h-3.5 w-3.5" /> {settings.bride_instagram}
            </LinkPill>
          )}
          {wa(settings.groom_name) && (
            <LinkPill href={wa(settings.groom_name)}>
              Kirim ucapan <ExternalLink className="h-3.5 w-3.5" />
            </LinkPill>
          )}
        </div>
      </div>
    </div>
  );
}
