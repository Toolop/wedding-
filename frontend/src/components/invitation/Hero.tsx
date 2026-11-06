"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CalendarHeart, ExternalLink, MapPinned, X } from "lucide-react";
import { getWishes, mediaUrl } from "@/lib/api";
import type { InvitationData, Settings, WishesResponse } from "@/lib/types";
import { CountdownStrip, useCountdown } from "./Countdown";
import { usePortalRoot } from "../ThemeProvider";
import { BLUSH, CHROME, INK, PAPER, RED, TONES, type IllustrationKey, type ToneKey } from "./watercolor";
import {
  CalendarPage,
  Camera,
  ClockFace,
  Envelope,
  GiftBox,
  Heart,
  HeartBurst,
  Illustration,
  MapPin,
  Phone,
  Rings,
  WashBackdrop,
} from "./WatercolorArt";
import { Flower, FlowerFrame } from "./Flowers";
import { GalleryPanel } from "./GalleryPanel";
import { PeekingCouple, PeekingCoupleCorners } from "./PeekingCouple";
import { GiftPanel } from "./GiftPanel";
import { CeremonyPanel } from "./CeremonyPanel";
import { ContactPanel, CouplePanel, DatePanel, splitTime } from "./PortalPanels";
import { RsvpPanel } from "./RsvpPanel";

/* ------------------------------------------------------------- date utils */
function parseDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function calendarFace(value: string) {
  const d = parseDate(value);
  if (!d) return { day: "--", month: "SOON" };
  return {
    day: String(d.getDate()),
    month: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d).toUpperCase(),
  };
}

/** Google Calendar "add event" link for the wedding day. */
function calendarUrl(settings: Settings) {
  const d = parseDate(settings.wedding_date);
  if (!d) return "";
  const stamp = (date: Date) =>
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate()
    ).padStart(2, "0")}`;
  const next = new Date(d.getTime() + 86400000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Pernikahan ${settings.groom_name} & ${settings.bride_name}`,
    dates: `${stamp(d)}/${stamp(next)}`,
    details: "Dengan penuh syukur, kami mengundang Anda di hari istimewa kami.",
    location: settings.resepsi_location || settings.akad_location || "",
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

/* ------------------------------------------------------------ card models */
/** a pop-up either links out (href) or opens another pop-up (card) */
type CardAction = { label: string; href?: string; card?: string };

type CardDef = {
  key: string;
  tone: ToneKey;
  title: string;
  subtitle: string;
  tilt: number;
  art: ReactNode;
  /** one live fact shown on the sticker at every size ("55 hari lagi", "4 foto") */
  chip?: string;
  /** a richer preview for roomy screens; `peekOnly` hides the art when it shows */
  peek?: ReactNode;
  peekOnly?: boolean;
  /** a compact preview that shows on phones, beside the art */
  mini?: ReactNode;
  /** only the five keys with `onBoard` sit on the sticker grid */
  onBoard?: boolean;
  /** spans two grid columns, for the card that gets the most attention */
  wide?: boolean;
  detail: ReactNode;
  actions: CardAction[];
};

type Live = { daysLeft: number | null; rsvp: WishesResponse["summary"] | null };

const PEEK_PHOTOS: IllustrationKey[] = ["cafe", "hello", "dinner"];

/** photos fanned out like prints on a table, overlapping and always centred inside the card */
function PhotoFan({ urls, mini = false }: { urls: string[]; mini?: boolean }) {
  const shown = urls.slice(0, mini ? 3 : 5);
  const mid = (shown.length - 1) / 2;
  return (
    <span className={`flex max-w-full items-center justify-center ${mini ? "" : "py-2"}`}>
      {shown.map((src, i) => {
        const off = i - mid;
        return (
          <span
            key={i}
            className={`relative block flex-none bg-white shadow-[3px_4px_0_rgba(47,61,53,0.22)] transition-transform duration-300 group-hover:-translate-y-1 ${
              mini ? "w-[46px] p-[3px] pb-1.5" : "w-[84px] p-1.5 pb-4"
            }`}
            style={{
              marginLeft: i ? (mini ? "-12px" : "-26px") : 0,
              rotate: `${off * 6}deg`,
              translate: `0 ${Math.abs(off) * (mini ? 2 : 4)}px`,
              zIndex: 10 - Math.round(Math.abs(off) * 2),
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="aspect-[4/5] w-full object-cover"
            />
          </span>
        );
      })}
    </span>
  );
}

function buildCards(data: InvitationData, live: Live): CardDef[] {
  const { settings, gallery, gifts } = data;
  const face = calendarFace(settings.wedding_date);
  const gcal = calendarUrl(settings);
  const wedding = parseDate(settings.wedding_date);
  const times = [settings.akad_time, settings.resepsi_time].filter(Boolean).map((t) => splitTime(t).start);
  const accounts = gifts?.length
    ? gifts.map((g) => g.provider || g.account_number)
    : settings.bank_name
      ? [settings.bank_name]
      : [];
  const photos = gallery.length
    ? gallery.map((g) => mediaUrl(g.image_url))
    : PEEK_PHOTOS.map((n) => `/images/illustrations/${n}.jpeg`);
  return [
    {
      key: "date",
      tone: "mauve",
      title: "The Date",
      subtitle: "Tandai harinya",
      tilt: -2.2,
      onBoard: true,
      art: <CalendarPage day={face.day} month={face.month} className="h-20 w-auto" />,
      chip:
        live.daysLeft === null
          ? undefined
          : live.daysLeft > 0
            ? `${live.daysLeft} hari lagi`
            : live.daysLeft === 0
              ? "Hari ini!"
              : "Sudah resmi",
      peek: wedding && (
        <span className="flex flex-col items-center">
          <span className="font-eyebrow text-[9px] uppercase opacity-60">
            {new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(wedding)}
          </span>
          <span className="font-poster text-6xl leading-none" style={{ color: "#C2676A" }}>
            {wedding.getDate()}
          </span>
          <span className="font-heading text-lg leading-tight">
            {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(wedding)}
          </span>
        </span>
      ),
      peekOnly: true,
      detail: <DatePanel settings={settings} />,
      actions: [
        ...(gcal ? [{ label: "Simpan ke Google Calendar", href: gcal }] : []),
        { label: "Detail acara", card: "ceremony" },
      ],
    },
    {
      key: "ceremony",
      tone: "cream",
      title: "Ceremony & Reception",
      subtitle: "Key details",
      tilt: 1.6,
      onBoard: true,
      art: <HeartBurst className="h-16 w-auto" />,
      chip: times.length ? `${times.join(" · ")} WIB` : undefined,
      peek: (
        <span className="flex w-full flex-col gap-1.5">
          {[
            { k: "Akad", t: settings.akad_time, at: settings.akad_location },
            { k: "Resepsi", t: settings.resepsi_time, at: settings.resepsi_location },
          ]
            .filter((e) => e.t || e.at)
            .map((e) => (
              <span key={e.k} className="flex items-center gap-2 rounded-[8px] bg-white/65 px-2 py-1 text-left">
                <span className="font-poster w-[52px] flex-none text-base tabular-nums">{splitTime(e.t).start}</span>
                <span className="min-w-0">
                  <span className="font-eyebrow block text-[8px] uppercase opacity-60">{e.k}</span>
                  <span className="font-heading block truncate text-sm leading-tight">{e.at}</span>
                </span>
              </span>
            ))}
        </span>
      ),
      detail: <CeremonyPanel settings={settings} />,
      actions: [
        { label: "Konfirmasi kehadiran", card: "rsvp" },
      ],
    },
    {
      key: "registry",
      tone: "sky",
      title: "Gift",
      subtitle: "Tanda kasih",
      tilt: -1.4,
      onBoard: true,
      art: <GiftBox className="h-16 w-auto" />,
      chip: accounts.length ? `${accounts.length} rekening` : undefined,
      peek: accounts.length > 0 && (
        <span className="flex flex-wrap justify-center gap-1.5">
          {accounts.slice(0, 4).map((a, i) => (
            <span
              key={i}
              className="font-poster rounded-[6px] bg-white/75 px-2 py-0.5 text-sm shadow-[2px_2px_0_rgba(63,107,87,0.18)]"
              style={{ rotate: `${i % 2 ? 2 : -2}deg` }}
            >
              {a}
            </span>
          ))}
        </span>
      ),
      detail: <GiftPanel settings={settings} gifts={gifts} />,
      actions: [{ label: "Kembali ke RSVP", card: "rsvp" }],
    },
    {
      key: "gallery",
      tone: "teal",
      title: "Galeri Kita",
      subtitle: "Momen kami berdua",
      tilt: 0.8,
      onBoard: true,
      wide: true,
      art: <Camera className="h-16 w-auto" />,
      chip: gallery.length ? `${gallery.length} foto` : "segera",
      peek: <PhotoFan urls={photos} />,
      mini: <PhotoFan urls={photos} mini />,
      peekOnly: true,
      detail: <GalleryPanel gallery={gallery} />,
      actions: [],
    },
    {
      key: "rsvp",
      tone: "magenta",
      title: "RSVP & Ucapan",
      subtitle: "Konfirmasi kehadiran",
      tilt: 1.8,
      onBoard: true,
      art: <Envelope className="h-16 w-auto" />,
      chip: live.rsvp && live.rsvp.hadir > 0 ? `${live.rsvp.hadir} sudah konfirmasi` : "Kabari kami",
      peek: live.rsvp && live.rsvp.guests > 0 && (
        <span className="flex flex-col items-center px-3">
          <span className="font-poster text-6xl leading-none">{live.rsvp.guests}</span>
          <span className="font-script whitespace-nowrap pb-1 pt-0.5 text-xl leading-snug opacity-90">tamu akan hadir</span>
        </span>
      ),
      peekOnly: true,
      detail: <RsvpPanel />,
      actions: [{ label: "Info hadiah", card: "registry" }],
    },
    {
      key: "couple",
      tone: "mauve",
      title: "The Couple",
      subtitle: "Mempelai",
      tilt: 0,
      art: <Rings className="h-14 w-auto" />,
      detail: <CouplePanel settings={settings} />,
      actions: [],
    },
    {
      key: "contact",
      tone: "teal",
      title: "Contact",
      subtitle: "Sapa kami",
      tilt: 0,
      art: <Phone className="h-12 w-auto" />,
      detail: <ContactPanel settings={settings} />,
      actions: [{ label: "Konfirmasi kehadiran", card: "rsvp" }],
    },
  ];
}

/* --------------------------------------------------------------- stickers */
function StickerCard({
  card,
  index,
  onOpen,
}: {
  card: CardDef;
  index: number;
  onOpen: () => void;
}) {
  const tone = TONES[card.tone];
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 24, scale: 0.9, rotate: card.tilt * 3 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: card.tilt }}
      transition={{
        delay: 0.35 + index * 0.09,
        type: "spring",
        stiffness: 200,
        damping: 16,
      }}
      whileHover={{ y: -6, rotate: 0, scale: 1.035 }}
      whileTap={{ scale: 0.96, rotate: 0 }}
      className={`group relative flex h-full min-h-0 flex-col items-center gap-0.5 overflow-hidden rounded-[14px] crayon-box wc px-2.5 pb-1.5 pt-2 text-center sm:px-3 sm:pb-2 sm:pt-2.5 ${card.wide ? "col-span-2" : ""} ${card.key === "registry" ? "max-sm:order-1" : ""} ${card.key === "gallery" ? "max-sm:order-2" : ""}`}
      style={{
        backgroundColor: tone.bg,
        color: tone.ink,
        boxShadow: `4px 5px 0 0 ${tone.edge}`,
      }}
    >
      <span className="font-heading shrink-0 text-[15px] leading-[1.1] sm:text-xl sm:leading-tight">{card.title}</span>
      <span className="font-eyebrow shrink-0 text-[8px] uppercase opacity-70 sm:text-[9px]">{card.subtitle}</span>

      {/* middle: a live preview on roomy screens, the hand-drawn art otherwise */}
      <span className={`flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2 overflow-hidden py-1 ${card.wide ? "!flex-row gap-3 sm:gap-8" : ""}`}>
        {card.peek && (
          <span className="hidden w-full justify-center lg:[@media(min-height:720px)]:flex">{card.peek}</span>
        )}
        {card.mini && (
          <span className="flex justify-center lg:[@media(min-height:720px)]:hidden">{card.mini}</span>
        )}
        <span
          className={`hidden items-end justify-center [@media(min-height:740px)]:flex ${
            card.peek ? (card.peekOnly ? "lg:[@media(min-height:720px)]:!hidden" : "lg:[@media(min-height:720px)]:[&>*]:h-12") : ""
          }`}
        >
          {card.art}
        </span>
      </span>

      <span className="flex w-full shrink-0 items-center justify-center gap-1 px-5">
        {card.chip && (
          <span
            className="truncate rounded-full bg-white/75 px-2 py-0.5 font-code text-[10px] leading-tight sm:text-[11px]"
            style={{ color: INK }}
          >
            {card.chip}
          </span>
        )}
      </span>
      <span className="pointer-events-none absolute bottom-2 right-2 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-90">
        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </span>
    </motion.button>
  );
}

/** Wide banner button, like the two on the left of the reference art. */
function BannerButton({
  label,
  sub,
  tone,
  delay,
  onClick,
}: {
  label: string;
  sub: string;
  tone: ToneKey;
  delay: number;
  onClick: () => void;
}) {
  const t = TONES[tone];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: "spring", stiffness: 180, damping: 18 }}
      whileHover={{ x: 6 }}
      whileTap={{ scale: 0.97 }}
      className="flex w-full items-center justify-between gap-3 rounded-[12px] crayon-box wc px-4 py-2.5 text-left"
      style={{ backgroundColor: t.bg, color: t.ink, boxShadow: `4px 4px 0 0 ${t.edge}` }}
    >
      <span>
        <span className="font-poster block text-base leading-tight sm:text-lg">{label}</span>
        <span className="block font-eyebrow text-[9px] uppercase opacity-70">{sub}</span>
      </span>
      <ArrowRight className="h-5 w-5 flex-none" />
    </motion.button>
  );
}

/* ------------------------------------------------------------- pop-up card */
function PopupWindow({
  card,
  onClose,
  onNavigate,
}: {
  card: CardDef;
  onClose: () => void;
  onNavigate: (key: string) => void;
}) {
  const tone = TONES[card.tone];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-[#3F6B57]/35 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
        initial={{ opacity: 0, scale: 0.82, y: 40, rotate: card.tilt }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 24 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="wc relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-[16px] crayon-box"
        style={{ backgroundColor: PAPER, boxShadow: "10px 12px 0 0 rgba(63,107,87,0.35)" }}
      >
        {/* browser chrome */}
        <div
          className="flex flex-none items-center gap-2 crayon-rule-b px-3 py-2"
          style={{ backgroundColor: CHROME }}
        >
          <span className="flex gap-1.5">
            {["#E9A9A1", "#E6CF8A", "#8CC3BA"].map((c) => (
              <span key={c} className="h-2.5 w-2.5 rounded-full border border-[#2F3D35]/40" style={{ backgroundColor: c }} />
            ))}
          </span>
          <span className="ml-1 flex-1 truncate rounded-full border border-dashed border-[#2F3D35]/35 bg-white/70 px-3 py-0.5 font-code text-[10px] text-[#2F3D35]/70">
            ours.co/{card.key}
          </span>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1 text-[#2F3D35] transition-transform hover:rotate-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* header strip in the card's own colour */}
        <div
          className="flex flex-none items-center justify-between gap-4 px-5 py-3"
          style={{ backgroundColor: tone.bg, color: tone.ink }}
        >
          <div>
            <h3 className="font-heading text-2xl leading-none sm:text-3xl">{card.title}</h3>
            <p className="font-eyebrow mt-1 text-[9px] uppercase opacity-70">{card.subtitle}</p>
          </div>
          <motion.span
            initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 200, damping: 14 }}
            className="flex-none"
          >
            {card.art}
          </motion.span>
        </div>

        {/* body — the only place scrolling is allowed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[#2F3D35]"
        >
          {card.detail}
        </motion.div>

        {/* actions */}
        {card.actions.length > 0 && (
          <div
            className="flex flex-none flex-wrap gap-2 crayon-rule-t px-4 py-3"
            style={{ backgroundColor: CHROME }}
          >
            {card.actions.map((action) =>
              action.href ? (
                <a
                  key={action.label}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full crayon-pill bg-white/70 px-4 py-2 font-code text-xs text-[#2F3D35] transition-transform hover:-translate-y-0.5"
                >
                  {action.label} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <button
                  key={action.label}
                  onClick={() => action.card && onNavigate(action.card)}
                  className="inline-flex items-center gap-1.5 rounded-full crayon-pill bg-[#3F6B57] px-4 py-2 font-code text-xs text-[#F6FAF2] transition-transform hover:-translate-y-0.5"
                >
                  {action.label} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------- hero */
export default function Hero({ data }: { data: InvitationData }) {
  const { settings } = data;
  const left = useCountdown(settings.wedding_date);
  // -1 once the moment has passed, so the sticker can say "Sudah resmi"
  const daysLeft = left ? (left.done ? -1 : left.d) : null;
  const [rsvp, setRsvp] = useState<WishesResponse["summary"] | null>(null);
  useEffect(() => {
    getWishes(1, 1)
      .then((res) => setRsvp(res.summary))
      .catch(() => undefined);
  }, []);
  const cards = useMemo(() => buildCards(data, { daysLeft, rsvp }), [data, daysLeft, rsvp]);
  const board = cards.filter((c) => c.onBoard);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const wedding = parseDate(settings.wedding_date);
  const venue = settings.resepsi_location || settings.akad_location;
  const openCard = cards.find((c) => c.key === openKey) ?? null;
  const portalRoot = usePortalRoot();

  const close = () => setOpenKey(null);
  /** swap one pop-up for another without letting the page behind move */
  const navigate = (key: string) => {
    setOpenKey(null);
    setTimeout(() => setOpenKey(key), 180);
  };

  const title = "The wedding of";
  const groom = settings.groom_name || "Groom";
  const bride = settings.bride_name || "Bride";
  const gcal = calendarUrl(settings);
  const weekday = wedding ? new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(wedding) : "";
  const monthShort = wedding ? new Intl.DateTimeFormat("id-ID", { month: "short" }).format(wedding) : "";

  return (
    <section
      className="relative isolate flex h-[100dvh] w-full items-center justify-center overflow-hidden px-3 py-3 sm:px-6 sm:py-5"
      style={{
        backgroundColor: "#F2F6EF",
      }}
    >
      <WashBackdrop />
      <FlowerFrame />

      {/* the whole invitation lives inside this one browser window; the couple peeks around its edges */}
      <div className="relative z-10 flex max-h-full w-full max-w-6xl flex-col">
        <motion.div
          initial={{ opacity: 0, y: 34, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="wc relative z-10 flex min-h-0 w-full flex-col overflow-hidden rounded-[18px] crayon-box bg-[#FCFDF9]/90 backdrop-blur-[2px]"
          style={{ boxShadow: "10px 12px 0 0 rgba(63,107,87,0.28)" }}
        >
          <div
            className="flex flex-none items-center gap-2 crayon-rule-b px-3 py-2"
            style={{ backgroundColor: CHROME }}
          >
            <span className="flex gap-1.5">
              {["#E9A9A1", "#E6CF8A", "#8CC3BA"].map((c) => (
                <span key={c} className="h-2.5 w-2.5 rounded-full border border-[#2F3D35]/40" style={{ backgroundColor: c }} />
              ))}
            </span>
            <span className="ml-1 flex-1 truncate rounded-full border border-dashed border-[#2F3D35]/35 bg-white/70 px-3 py-0.5 font-code text-[10px] text-[#2F3D35]/70">
              ours.co — your wedding portal
            </span>
          </div>

          <div className="grid min-h-0 flex-1 gap-4 px-4 py-4 sm:px-8 sm:py-6 lg:grid-cols-12 lg:gap-8">
            {/* ---- poster column: an invitation card, not a headline ---- */}
            <div className="flex min-h-0 flex-col lg:col-span-5">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="flex items-center gap-2 font-eyebrow text-[10px] uppercase text-[#3F6B57] sm:text-xs"
              >
                <Flower kind="sprig" className="h-5 w-auto -rotate-[30deg] sm:h-6" />
                {title}
                <span aria-hidden className="h-px flex-1 border-t-2 border-dashed border-[#3F6B57]/30" />
              </motion.p>

              {/* the couple's names are the headline, and the door to their own pop-up */}
              <motion.button
                onClick={() => setOpenKey("couple")}
                whileHover={{ x: 4 }}
                aria-label="Tentang mempelai"
                className="mt-1 flex w-fit flex-wrap items-baseline gap-x-3 text-left font-poster text-[2.6rem] leading-[1.05] text-[#2F3D35] sm:text-5xl lg:text-[clamp(2.75rem,4.2vw,3.9rem)]"
              >
                {[groom, "&", bride].map((part, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.12, type: "spring", stiffness: 240, damping: 18 }}
                    className={i === 1 ? "font-script text-[1.1em] font-normal" : undefined}
                    style={i === 1 ? { color: RED } : undefined}
                  >
                    {part}
                  </motion.span>
                ))}
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 220, damping: 14 }}
                  className="self-center"
                >
                  <Rings className="h-7 w-auto sm:h-8 lg:h-10" delay={0.7} />
                </motion.span>
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75, duration: 0.6 }}
                className="mt-1 font-script text-lg leading-snug text-[#2F3D35]/70 sm:text-xl lg:text-2xl"
              >
                dengan penuh cinta, kami mengundangmu
              </motion.p>

              {/* save-the-date ticket: date on the stub, live countdown and venue on the body */}
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.6 }}
                onClick={() => setOpenKey("date")}
                whileHover={{ y: -3, rotate: -0.4 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Hitung mundur, buka detail tanggal"
                className="mt-3 flex w-full items-stretch rounded-[14px] crayon-box wc text-left sm:mt-4"
                style={{ backgroundColor: PAPER, boxShadow: "5px 6px 0 0 rgba(63,107,87,0.22)" }}
              >
                <span
                  className="flex w-[84px] flex-none flex-col items-center justify-center rounded-l-[12px] px-2 py-2 sm:w-[96px]"
                  style={{ backgroundColor: TONES.magenta.bg, color: TONES.magenta.ink }}
                >
                  {wedding ? (
                    <>
                      <span className="font-eyebrow text-[9px] uppercase opacity-80">{weekday}</span>
                      <span className="font-poster text-[38px] leading-none sm:text-[44px]">
                        {String(wedding.getDate()).padStart(2, "0")}
                      </span>
                      <span className="font-eyebrow text-[9px] uppercase opacity-80">
                        {monthShort} {wedding.getFullYear()}
                      </span>
                    </>
                  ) : (
                    <CalendarHeart className="h-8 w-8" />
                  )}
                </span>
                {/* perforation */}
                <span aria-hidden className="my-2 border-l-2 border-dashed border-[#2F3D35]/25" />
                <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2 sm:px-4">
                  <span className="font-eyebrow text-[9px] uppercase text-[#3F6B57]">menuju hari bahagia</span>
                  <CountdownStrip target={settings.wedding_date} />
                  {venue && (
                    <span className="flex min-w-0 items-center gap-1 font-code text-xs text-[#2F3D35]/70">
                      <MapPinned className="h-3.5 w-3.5 flex-none" />
                      <span className="truncate">{venue}</span>
                    </span>
                  )}
                </span>
              </motion.button>

              <div className="mt-4 hidden lg:block">
                <BannerButton
                  label="KONFIRMASI KEHADIRAN"
                  sub="Kabari kami sebelum hari H"
                  tone="magenta"
                  delay={0.9}
                  onClick={() => setOpenKey("rsvp")}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.05, duration: 0.5 }}
                  className="mt-2.5 flex flex-wrap items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setOpenKey("ceremony")}
                    className="inline-flex items-center gap-1.5 rounded-full crayon-pill bg-white/70 px-3.5 py-1.5 font-code text-xs text-[#3F6B57] transition-colors hover:bg-[#E4EEDF]"
                  >
                    <MapPinned className="h-3.5 w-3.5" /> Lihat lokasi
                  </button>
                  {gcal && (
                    <a
                      href={gcal}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full crayon-pill bg-white/70 px-3.5 py-1.5 font-code text-xs text-[#3F6B57] transition-colors hover:bg-[#E4EEDF]"
                    >
                      <CalendarHeart className="h-3.5 w-3.5" /> Simpan tanggal
                    </a>
                  )}
                </motion.div>
              </div>

              {/* a taped-in polaroid of the two of them, with a handwritten note beside it */}
              <motion.div
                initial={{ opacity: 0, y: 16, rotate: -8 }}
                animate={{ opacity: 1, y: 0, rotate: -3 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 140, damping: 16 }}
                className="mt-auto hidden min-h-0 items-end gap-3 pt-3 lg:[@media(min-height:700px)]:flex"
              >
                <span
                  className="relative block flex-none rounded-[4px] bg-white p-1.5 pb-5"
                  style={{ boxShadow: "3px 5px 0 0 rgba(63,107,87,0.18), 0 0 0 1px rgba(47,61,53,0.08)" }}
                >
                  <span
                    aria-hidden
                    className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 rotate-[4deg] opacity-80"
                    style={{ backgroundColor: "#D9E6CC" }}
                  />
                  <Illustration name="cafe" className="h-auto max-h-36 w-auto" />
                </span>
                <span className="mb-4 flex rotate-3 items-center gap-1 font-script text-xl leading-tight text-[#2F3D35]/70">
                  sampai jumpa
                  <br />
                  di hari H kami
                  <Heart color={BLUSH} className="h-5 w-auto" />
                </span>
              </motion.div>
            </div>

            {/* ---- sticker board ---- */}
            <div className="grid min-h-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:col-span-7 lg:gap-4">
              {board.map((card, i) => (
                <StickerCard
                  key={card.key}
                  card={card}
                  index={i}
                  onOpen={() => setOpenKey(card.key)}
                />
              ))}
            </div>
          </div>

          {/* ---- bottom dock: place / time / contact as tappable chips, rings as the monogram ---- */}
          <div
            className="flex flex-none items-center justify-between gap-3 crayon-rule-t px-3 py-2.5 text-[#2F3D35] sm:px-6 sm:py-3"
            style={{ backgroundColor: "#E4EEDF" }}
          >
            <motion.button
              onClick={() => setOpenKey("couple")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              whileHover={{ y: -2 }}
              aria-label="Tentang mempelai"
              className="hidden flex-none items-center gap-2 sm:flex"
            >
              <Rings className="h-8 w-auto" delay={1.4} />
              <span className="font-script text-xl leading-none text-[#2F3D35]/75">
                {bride} &amp; {groom}
              </span>
            </motion.button>
            <div className="flex min-w-0 flex-1 items-stretch justify-center gap-2 sm:flex-none sm:gap-3">
              {[
                { key: "place", label: "Lokasi", sub: venue || "Lihat peta", icon: <MapPin className="h-6 w-auto" />, target: "ceremony" },
                { key: "time", label: "Waktu", sub: wedding ? `${weekday}, ${wedding.getDate()} ${monthShort}` : "Tanggal", icon: <ClockFace className="h-6 w-auto" />, target: "date" },
                { key: "contact", label: "Kontak", sub: "Sapa kami", icon: <Phone className="h-6 w-auto" />, target: "contact" },
              ].map((item, i) => (
                <motion.button
                  key={item.key}
                  onClick={() => setOpenKey(item.target)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -3, rotate: i % 2 ? 0.8 : -0.8 }}
                  whileTap={{ scale: 0.96 }}
                  className="crayon-box flex min-w-0 flex-1 items-center gap-2 rounded-[12px] bg-white/70 px-2.5 py-1.5 text-left shadow-[3px_3px_0_rgba(63,107,87,0.2)] sm:flex-none sm:gap-2.5 sm:px-3.5"
                >
                  <span className="flex-none">{item.icon}</span>
                  <span className="min-w-0">
                    <span className="font-heading block text-sm leading-tight sm:text-base">{item.label}</span>
                    <span className="font-eyebrow block max-w-[110px] truncate text-[8px] uppercase opacity-60 sm:text-[9px]">{item.sub}</span>
                  </span>
                </motion.button>
              ))}
            </div>
            <span className="hidden w-[150px] flex-none lg:block" aria-hidden />
          </div>
          <PeekingCoupleCorners />
        </motion.div>
        <PeekingCouple />
      </div>

      {/* portalled so pop-ups escape the hero's stacking context and sit above the petals */}
      {portalRoot &&
        createPortal(
          <AnimatePresence>
            {openCard && (
              <PopupWindow
                key={openCard.key}
                card={openCard}
                onClose={close}
                onNavigate={navigate}
              />
            )}
          </AnimatePresence>,
          portalRoot
        )}
    </section>
  );
}
