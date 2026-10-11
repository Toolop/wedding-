"use client";

import { motion } from "framer-motion";
import { ExternalLink, Instagram } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import { parseDate } from "@/lib/dates";
import type { Settings } from "@/lib/types";
import { FlipCountdown } from "./Countdown";
import { BLUSH, INK, PAPER, RED, TONES } from "./watercolor";
import { Heart, Illustration, Rings } from "./WatercolorArt";

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

/** outline link button in the crayon language */
function LinkPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full crayon-pill px-3 py-1.5 font-code text-[11px] transition-transform hover:-translate-y-0.5"
      style={{ color: INK }}
    >
      {children}
    </a>
  );
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

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** a hand-drawn crayon loop, drawn on when the calendar appears */
const CIRCLE = "M9 21 C5 10 22 3 34 7 C45 11 46 27 35 34 C24 40 7 36 5 25 C4 18 9 12 15 10";

/** the wedding month as a wall calendar, with the day circled in red crayon */
function MonthCalendar({ date }: { date: Date }) {
  const year = date.getFullYear();
  const month = date.getMonth();
  // Monday-first, the way Indonesian calendars print it
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  const title = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date);

  return (
    <div
      className="relative overflow-hidden rounded-[14px] crayon-box wc"
      style={{ backgroundColor: PAPER, boxShadow: `4px 5px 0 0 ${TONES.mauve.edge}` }}
    >
      <div className="relative flex items-center justify-center px-4 pb-2 pt-4" style={{ backgroundColor: RED }}>
        {/* binder rings */}
        <span aria-hidden className="absolute inset-x-10 -top-1 flex justify-between">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-3.5 w-1.5 rounded-full border-2 border-[#2B2522] bg-[#FFFDF8]" />
          ))}
        </span>
        <span className="font-poster text-lg uppercase tracking-[0.18em] text-[#FFF7EC]">{title}</span>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 px-2.5 pb-3 pt-2 text-center sm:px-4">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className="font-eyebrow pb-1 text-[9px] uppercase"
            style={{ color: i === 6 ? RED : INK, opacity: i === 6 ? 0.9 : 0.55 }}
          >
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          const sunday = i % 7 === 6;
          const theDay = day === date.getDate();
          return (
            <span
              key={i}
              className={`relative grid h-8 place-items-center font-heading text-lg tabular-nums ${
                theDay ? "font-bold" : ""
              }`}
              style={{ color: sunday || theDay ? RED : INK, opacity: day ? 1 : 0 }}
            >
              {day}
              {theDay && (
                <>
                  <svg aria-hidden viewBox="0 0 50 42" className="absolute -inset-x-1 -inset-y-1.5 h-[calc(100%+12px)] w-[calc(100%+8px)] overflow-visible">
                    <motion.path
                      d={CIRCLE}
                      fill="none"
                      stroke={RED}
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.45, duration: 0.9, ease: "easeInOut" }}
                    />
                  </svg>
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 12 }}
                    transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 12 }}
                    className="absolute -right-1 -top-2"
                  >
                    <Heart color={BLUSH} className="h-4 w-auto" animate={false} />
                  </motion.span>
                </>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function DatePanel({ settings }: { settings: Settings }) {
  const date = parseDate(settings.wedding_date);
  const weekday = date && new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date);
  const dayMonth =
    date && new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
  const times = [
    settings.akad_time && `Akad ${splitTime(settings.akad_time).start}`,
    settings.resepsi_time && `Resepsi ${splitTime(settings.resepsi_time).start}`,
  ].filter(Boolean);
  const zone = splitTime(settings.resepsi_time || settings.akad_time).zone;

  return (
    <div className="space-y-5" style={{ color: INK }}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {weekday && <p className="font-eyebrow text-[10px] uppercase opacity-60">{weekday}</p>}
          <p className="font-heading text-[30px] leading-tight">{dayMonth ?? settings.wedding_date}</p>
          {times.length > 0 && (
            <p className="mt-0.5 font-code text-[11px] opacity-70">
              {times.join(" · ")} {zone}
            </p>
          )}
        </div>
        <Illustration name="champions" className="h-20 w-auto flex-none sm:h-24" />
      </div>

      <div>
        <p className="font-eyebrow mb-2 text-[9px] uppercase opacity-60">Menghitung hari</p>
        <FlipCountdown target={settings.wedding_date} size="lg" />
        <p className="font-script mt-3 text-xl leading-snug opacity-80">
          Satu hari yang kami tunggu sejak lama, dan kami ingin Anda ada di dalamnya.
        </p>
      </div>

      {date && <MonthCalendar date={date} />}

      {settings.quote && (
        <figure className="relative mx-1 rotate-[-0.8deg] bg-white/90 px-5 pb-5 pt-6 shadow-[3px_5px_0_rgba(62,74,107,0.16)]"
          style={{
            // torn bottom edge
            clipPath:
              "polygon(0 0, 100% 0, 100% 94%, 94% 97%, 88% 94%, 81% 98%, 74% 95%, 66% 99%, 58% 95%, 50% 98%, 42% 94%, 34% 98%, 26% 95%, 18% 99%, 10% 95%, 4% 98%, 0 95%)",
          }}
        >
          <span
            aria-hidden
            className="absolute left-1/2 top-0 h-4 w-16 -translate-x-1/2 rotate-[-3deg] opacity-80"
            style={{ backgroundColor: TONES.butter.bg }}
          />
          <span aria-hidden className="font-poster absolute left-3 top-1 text-5xl leading-none opacity-15">
            “
          </span>
          <blockquote className="font-script relative text-[22px] leading-snug">{settings.quote}</blockquote>
          {settings.quote_author && (
            <figcaption className="font-eyebrow mt-3 text-right text-[9px] uppercase opacity-60">
              — {settings.quote_author}
            </figcaption>
          )}
        </figure>
      )}
    </div>
  );
}

/* --------------------------------------------------- 2. ceremony details */

/** "08:00 - 10:00 WIB" → start / end / zone; anything unparseable stays whole in `start` */
export function splitTime(value: string) {
  const m = value.match(
    /^\s*(\d{1,2}[.:]\d{2})\s*(?:(?:-|–|—|s\.?\/?d\.?|sampai)\s*(\d{1,2}[.:]\d{2}|selesai))?\s*(.*)$/i
  );
  if (!m) return { start: value.trim(), end: "", zone: "" };
  return { start: m[1].replace(".", ":"), end: m[2]?.replace(".", ":") ?? "", zone: m[3].trim() };
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
      className="flex-1 rounded-[12px] crayon-box wc p-3 text-center"
      style={{ backgroundColor: t.bg, color: t.ink, boxShadow: `4px 4px 0 0 ${t.edge}` }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(image)}
          alt={name}
          className="mx-auto aspect-square w-24 rounded-full border-2 border-dashed border-[#2B2522]/60 object-cover"
          style={{}}
        />
      ) : (
        <div className="mx-auto grid aspect-square w-24 place-items-center rounded-full border-2 border-dashed border-[#2B2522]/60" style={{}}>
          <Heart className="h-10 w-auto" />
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
          className="mt-2 inline-flex items-center gap-1 rounded-full crayon-pill px-3 py-1 font-code text-[10px]"
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
      <Illustration name="hello" className="mx-auto h-48 w-auto" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Person
          role="Mempelai Pria"
          name={settings.groom_name}
          full={settings.groom_full_name}
          parents={settings.groom_parents}
          instagram={settings.groom_instagram}
          image={settings.groom_photo}
          tone="sky"
        />
        <Person
          role="Mempelai Wanita"
          name={settings.bride_name}
          full={settings.bride_full_name}
          parents={settings.bride_parents}
          instagram={settings.bride_instagram}
          image={settings.bride_photo}
          tone="mauve"
        />
      </div>
      <div className="flex items-center justify-center gap-2 opacity-70" style={{ color: INK }}>
        <Rings className="h-8 w-auto" />
        <span className="font-script text-2xl">bersama, mulai hari itu</span>
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
        className="rounded-[12px] crayon-box wc px-4 py-3"
        style={{ backgroundColor: TONES.teal.bg, color: TONES.teal.ink }}
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
