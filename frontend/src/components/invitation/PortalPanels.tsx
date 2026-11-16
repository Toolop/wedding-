"use client";

import { motion } from "framer-motion";
import { ExternalLink, Instagram } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import { parseDate } from "@/lib/dates";
import type { Settings } from "@/lib/types";
import { CountdownClassic } from "./Countdown";
import { colors } from "./theme";
import { DoubleFrame, Eyebrow, Ornament } from "./classy";
import { Illustration } from "./WatercolorArt";

/* ------------------------------------------------------------ primitives */

/** label + value line, the standard row inside every pop-up */
export function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-line-soft py-2 last:border-0">
      <span className="font-eyebrow text-[10px] uppercase tracking-[0.25em] text-gold-ink">{label}</span>
      <span className="font-serif text-xl font-semibold leading-snug">{value}</span>
    </div>
  );
}

/** outline link button */
function LinkPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-paper px-4 font-code text-xs transition-colors hover:border-gold"
      style={{ color: colors.ink }}
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

/** the wedding month as a quiet calendar card, with the day ringed in gold */
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
    <DoubleFrame innerClassName="overflow-hidden">
      <div className="bg-brand px-4 py-3 text-center">
        <span className="font-serif text-xl font-medium uppercase tracking-[0.18em] text-on-brand">{title}</span>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 px-2.5 pb-3 pt-2 text-center sm:px-4">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={`font-eyebrow pb-1 text-[10px] uppercase ${i === 6 ? "text-gold-ink" : "text-ink-soft"}`}
          >
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          const theDay = day === date.getDate();
          return (
            <span
              key={i}
              className={`relative mx-auto grid h-8 w-8 place-items-center rounded-full font-code text-sm tabular-nums ${
                theDay ? "bg-brand font-semibold text-paper" : i % 7 === 6 ? "text-gold-ink" : ""
              }`}
              style={{ opacity: day ? 1 : 0 }}
            >
              {day}
              {theDay && (
                <motion.span
                  aria-hidden
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -inset-1 rounded-full border border-gold"
                />
              )}
            </span>
          );
        })}
      </div>
    </DoubleFrame>
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
    <div className="space-y-5" style={{ color: colors.ink }}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {weekday && <Eyebrow>{weekday}</Eyebrow>}
          <p className="font-serif text-[2rem] font-medium leading-tight">{dayMonth ?? settings.wedding_date}</p>
          {times.length > 0 && (
            <p className="mt-0.5 font-code text-xs text-ink-soft">
              {times.join(" · ")} {zone}
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="font-eyebrow mb-2 text-center text-[10px] uppercase tracking-[0.3em] text-gold-ink">Menghitung hari</p>
        <div className="rounded-[6px] bg-brand p-1.5 text-on-brand">
          <div className="rounded-[3px] border border-honey/70 px-3 py-4">
            <CountdownClassic target={settings.wedding_date} />
          </div>
        </div>
        <p className="font-script mt-3 text-center text-2xl leading-snug text-ink-soft">
          Satu hari yang kami tunggu sejak lama, dan kami ingin Anda ada di dalamnya.
        </p>
      </div>

      {date && <MonthCalendar date={date} />}

      {settings.quote && (
        <figure className="relative border-y border-line px-5 py-6 text-center">
          <span aria-hidden className="absolute left-1/2 top-1 -translate-x-1/2 font-serif text-5xl leading-none text-gold">
            “
          </span>
          <blockquote className="font-script relative pt-5 text-2xl leading-snug">{settings.quote}</blockquote>
          {settings.quote_author && (
            <figcaption className="font-eyebrow mt-3 text-[11px] uppercase tracking-[0.25em] text-gold-ink">
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
}: {
  role: string;
  name: string;
  full: string;
  parents: string;
  instagram: string;
  image: string;
}) {
  return (
    <DoubleFrame className="flex-1" innerClassName="p-4 text-center">
      <span className="mx-auto block aspect-square w-24 rounded-full border border-gold p-[3px]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(image)} alt={name} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center rounded-full bg-chrome font-serif text-3xl text-brand">
            {(name || "?").charAt(0)}
          </span>
        )}
      </span>
      <Eyebrow className="mt-3 justify-center text-[10px]">{role}</Eyebrow>
      <h4 className="mt-0.5 font-serif text-2xl font-semibold leading-tight">{full || name}</h4>
      {parents && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{parents}</p>}
      {instagram && (
        <a
          href={`https://instagram.com/${instagram.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-full border border-line px-4 font-code text-xs transition-colors hover:border-gold"
        >
          <Instagram className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} />@{instagram.replace("@", "")}
        </a>
      )}
    </DoubleFrame>
  );
}

export function CouplePanel({ settings }: { settings: Settings }) {
  return (
    <div className="space-y-3">
      {settings.hero_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(settings.hero_image)}
          alt={`${settings.groom_name} & ${settings.bride_name}`}
          draggable={false}
          className="mx-auto h-48 w-auto max-w-full rounded-[3px] border border-gold-soft object-cover"
        />
      ) : (
        <Illustration name="hello" className="mx-auto h-48 w-auto" />
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Person
          role="Mempelai Pria"
          name={settings.groom_name}
          full={settings.groom_full_name}
          parents={settings.groom_parents}
          instagram={settings.groom_instagram}
          image={settings.groom_photo}
        />
        <Person
          role="Mempelai Wanita"
          name={settings.bride_name}
          full={settings.bride_full_name}
          parents={settings.bride_parents}
          instagram={settings.bride_instagram}
          image={settings.bride_photo}
        />
      </div>
      <div className="flex flex-col items-center gap-2 pt-1" style={{ color: colors.ink }}>
        <Ornament />
        <span className="font-script text-2xl text-ink-soft">bersama, mulai hari itu</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- 8. contact us */

export function ContactPanel({ settings }: { settings: Settings }) {
  const wa = (name: string) =>
    name ? `https://wa.me/?text=${encodeURIComponent(`Halo ${name}, selamat ya!`)}` : "";
  return (
    <div className="space-y-3" style={{ color: colors.ink }}>
      <p className="font-script text-2xl leading-snug text-ink-soft">
        Ada yang ingin ditanyakan soal acara? Sapa kami lewat kanal ini.
      </p>
      <div className="rounded-[6px] border border-line bg-mist-soft px-4 py-3">
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
