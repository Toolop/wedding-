"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CalendarHeart, ExternalLink, MapPinned, X } from "lucide-react";
import { getWishes, mediaUrl } from "@/lib/api";
import { parseLooseDate } from "@/lib/dates";
import type { InvitationData, Settings, WishesResponse } from "@/lib/types";
import { FlipCountdown, useCountdown } from "./Countdown";
import { usePortalRoot } from "../ThemeProvider";
import { BLUSH, CHROME, INK, PAPER, TONES, type IllustrationKey, type ToneKey } from "./watercolor";
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
  OpenBook,
  Phone,
  Rings,
  WashBackdrop,
} from "./WatercolorArt";
import { GalleryPanel } from "./GalleryPanel";
import { GiftPanel } from "./GiftPanel";
import { CeremonyPanel } from "./CeremonyPanel";
import { ContactPanel, CouplePanel, DatePanel, splitTime } from "./PortalPanels";
import { RsvpPanel } from "./RsvpPanel";
import { StoryPanel } from "./StoryPanel";

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
  /** only the six keys with `onBoard` sit on the sticker grid */
  onBoard?: boolean;
  detail: ReactNode;
  actions: CardAction[];
};

type Live = { daysLeft: number | null; rsvp: WishesResponse["summary"] | null };

const PEEK_PHOTOS: IllustrationKey[] = ["cafe", "hello", "dinner"];

/** three photos fanned out like prints on a table */
function PhotoFan({ urls }: { urls: string[] }) {
  return (
    <span className="relative block h-24 w-40">
      {urls.slice(0, 3).map((src, i) => (
        <span
          key={i}
          className="absolute top-1 block w-[68px] bg-white p-1 pb-3 shadow-[2px_3px_0_rgba(62,74,107,0.25)] transition-transform duration-300 group-hover:-translate-y-1"
          style={{ left: `${i * 36}px`, rotate: `${(i - 1) * 9}deg`, zIndex: i === 1 ? 2 : 1 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="aspect-square w-full object-cover" />
        </span>
      ))}
    </span>
  );
}

function buildCards(data: InvitationData, live: Live): CardDef[] {
  const { settings, story, gallery, gifts } = data;
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
  const years = story
    .map((s) => parseLooseDate(s.event_date)?.getFullYear())
    .filter((y): y is number => !!y);
  const since = years.length ? Math.min(...years) : null;

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
          <span className="font-poster text-6xl leading-none" style={{ color: "#D2574A" }}>
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
      title: "Registry",
      subtitle: "Curated gifts",
      tilt: -1.4,
      onBoard: true,
      art: <GiftBox className="h-16 w-auto" />,
      chip: accounts.length ? `${accounts.length} rekening` : undefined,
      peek: accounts.length > 0 && (
        <span className="flex flex-wrap justify-center gap-1.5">
          {accounts.slice(0, 4).map((a, i) => (
            <span
              key={i}
              className="font-poster rounded-[6px] bg-white/75 px-2 py-0.5 text-sm shadow-[2px_2px_0_rgba(62,74,107,0.18)]"
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
      tilt: 2.4,
      onBoard: true,
      art: <Camera className="h-16 w-auto" />,
      chip: gallery.length ? `${gallery.length} foto` : "segera",
      peek: <PhotoFan urls={photos} />,
      peekOnly: true,
      detail: <GalleryPanel gallery={gallery} />,
      actions: [{ label: "Kisah kami", card: "story" }],
    },
    {
      key: "story",
      tone: "coral",
      title: "Planning Timeline",
      subtitle: "Track our progress",
      tilt: -2.8,
      onBoard: true,
      art: <OpenBook className="h-16 w-auto" />,
      chip: story.length ? `${story.length} bab` : undefined,
      peek: since !== null && (
        <span className="flex w-full items-center gap-1.5 px-1">
          <span className="font-code text-[10px] opacity-70">{since}</span>
          <span className="relative h-2 flex-1">
            <span
              className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2"
              style={{ backgroundImage: `repeating-linear-gradient(90deg, ${INK}88 0 5px, transparent 5px 9px)` }}
            />
            {story.slice(0, 6).map((s, i, all) => (
              <span
                key={s.id}
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                style={{ left: `${(i / Math.max(1, all.length)) * 100}%`, borderColor: INK, backgroundColor: INK }}
              />
            ))}
          </span>
          <Heart className="h-5 w-auto flex-none" color={BLUSH} animate={false} />
        </span>
      ),
      detail: <StoryPanel story={story} settings={settings} />,
      actions: [{ label: "Lihat galeri", card: "gallery" }],
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
        <span className="flex flex-col items-center">
          <span className="font-poster text-5xl leading-none">{live.rsvp.guests}</span>
          <span className="font-script text-lg leading-tight opacity-85">tamu akan hadir</span>
        </span>
      ),
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
      actions: [{ label: "Kisah kami", card: "story" }],
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
      className="group relative flex h-full min-h-0 flex-col items-center gap-0.5 overflow-hidden rounded-[14px] crayon-box wc px-2.5 pb-2 pt-2.5 text-center sm:px-3"
      style={{
        backgroundColor: tone.bg,
        color: tone.ink,
        boxShadow: `4px 5px 0 0 ${tone.edge}`,
      }}
    >
      <span className="font-heading text-base leading-tight sm:text-xl">{card.title}</span>
      <span className="font-eyebrow text-[8px] uppercase opacity-70 sm:text-[9px]">{card.subtitle}</span>

      {/* middle: a live preview on roomy screens, the hand-drawn art otherwise */}
      <span className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2 overflow-hidden py-1">
        {card.peek && (
          <span className="hidden w-full justify-center lg:[@media(min-height:720px)]:flex">{card.peek}</span>
        )}
        <span
          className={`hidden items-end justify-center [@media(min-height:740px)]:flex ${
            card.peek ? (card.peekOnly ? "lg:[@media(min-height:720px)]:hidden" : "lg:[@media(min-height:720px)]:[&>*]:h-12") : ""
          }`}
        >
          {card.art}
        </span>
      </span>

      <span className="flex w-full items-center justify-center gap-1">
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
        className="absolute inset-0 bg-[#3E4A6B]/35 backdrop-blur-[3px]"
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
        style={{ backgroundColor: PAPER, boxShadow: "10px 12px 0 0 rgba(62,74,107,0.35)" }}
      >
        {/* browser chrome */}
        <div
          className="flex flex-none items-center gap-2 crayon-rule-b px-3 py-2"
          style={{ backgroundColor: CHROME }}
        >
          <span className="flex gap-1.5">
            {["#E9A195", "#F2C66D", "#8CC3BA"].map((c) => (
              <span key={c} className="h-2.5 w-2.5 rounded-full border border-[#2B2522]/40" style={{ backgroundColor: c }} />
            ))}
          </span>
          <span className="ml-1 flex-1 truncate rounded-full border border-dashed border-[#2B2522]/35 bg-white/70 px-3 py-0.5 font-code text-[10px] text-[#2B2522]/70">
            ours.co/{card.key}
          </span>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1 text-[#2B2522] transition-transform hover:rotate-90"
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
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[#2B2522]"
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
                  className="inline-flex items-center gap-1.5 rounded-full crayon-pill bg-white/70 px-4 py-2 font-code text-xs text-[#2B2522] transition-transform hover:-translate-y-0.5"
                >
                  {action.label} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <button
                  key={action.label}
                  onClick={() => action.card && onNavigate(action.card)}
                  className="inline-flex items-center gap-1.5 rounded-full crayon-pill bg-[#3E4A6B] px-4 py-2 font-code text-xs text-[#FFF7EC] transition-transform hover:-translate-y-0.5"
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

  const title = "THE WEDDING";

  return (
    <section
      className="relative isolate flex h-[100dvh] w-full items-center justify-center overflow-hidden px-3 py-3 sm:px-6 sm:py-5"
      style={{
        backgroundColor: "#FAF5EC",
      }}
    >
      <WashBackdrop />

      {/* the whole invitation lives inside this one browser window */}
      <motion.div
        initial={{ opacity: 0, y: 34, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="wc relative z-10 flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-[18px] crayon-box bg-[#FFFDF8]/90 backdrop-blur-[2px]"
        style={{ boxShadow: "10px 12px 0 0 rgba(62,74,107,0.28)" }}
      >
        <div
          className="flex flex-none items-center gap-2 crayon-rule-b px-3 py-2"
          style={{ backgroundColor: CHROME }}
        >
          <span className="flex gap-1.5">
            {["#E9A195", "#F2C66D", "#8CC3BA"].map((c) => (
              <span key={c} className="h-2.5 w-2.5 rounded-full border border-[#2B2522]/40" style={{ backgroundColor: c }} />
            ))}
          </span>
          <span className="ml-1 flex-1 truncate rounded-full border border-dashed border-[#2B2522]/35 bg-white/70 px-3 py-0.5 font-code text-[10px] text-[#2B2522]/70">
            ours.co — your wedding portal
          </span>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 px-4 py-4 sm:px-8 sm:py-6 lg:grid-cols-12 lg:gap-8">
          {/* ---- poster column ---- */}
          <div className="flex min-h-0 flex-col lg:col-span-5">
            <h1 className="font-poster flex items-center whitespace-nowrap text-4xl leading-[0.95] text-[#2B2522] sm:text-5xl lg:text-[clamp(2.75rem,4.1vw,3.75rem)]">
              {title.split("").map((ch, i) => (
                <motion.span
                  key={`${ch}-${i}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.035, type: "spring", stiffness: 260, damping: 18 }}
                  className={ch === " " ? "w-3" : undefined}
                >
                  {ch}
                </motion.span>
              ))}
              <motion.span
                animate={{ opacity: [1, 0.1, 1] }}
                transition={{ duration: 1.1, repeat: Infinity }}
                className="ml-2 inline-block h-9 w-[3px] bg-[#2B2522] sm:h-12 lg:h-14"
              />
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-1 font-script text-xl text-[#2B2522]/75 sm:text-2xl lg:text-3xl"
            >
              connect. coordinate. cherish.
            </motion.p>

            {/* the couple's names double as the door to their own pop-up */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              onClick={() => setOpenKey("couple")}
              whileHover={{ x: 4 }}
              className="mt-1.5 flex w-fit items-center gap-2 font-heading text-2xl text-[#D2574A] sm:text-3xl lg:text-4xl"
            >
              {settings.groom_name || "Groom"} &amp; {settings.bride_name || "Bride"}
              <Rings className="h-6 w-auto lg:h-8" />
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-code text-xs text-[#2B2522]/75 sm:text-sm"
            >
              {wedding && (
                <span className="inline-flex items-center gap-1">
                  <CalendarHeart className="h-3.5 w-3.5" />
                  {new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(wedding)}
                </span>
              )}
              {venue && (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPinned className="h-3.5 w-3.5 flex-none" />
                  <span className="truncate">{venue}</span>
                </span>
              )}
            </motion.p>

            {/* live countdown; tapping it opens the date pop-up */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.6 }}
              onClick={() => setOpenKey("date")}
              whileHover={{ y: -3 }}
              aria-label="Hitung mundur, buka detail tanggal"
              className="mt-3 w-fit"
            >
              <FlipCountdown target={settings.wedding_date} />
            </motion.button>

            <div className="mt-5 hidden space-y-2.5 lg:block">
              <BannerButton
                label="KONFIRMASI KEHADIRAN"
                sub="Kabari kami sebelum hari H"
                tone="magenta"
                delay={0.9}
                onClick={() => setOpenKey("rsvp")}
              />
              <BannerButton
                label="LIHAT LOKASI"
                sub={venue || "Akad & resepsi"}
                tone="butter"
                delay={1}
                onClick={() => setOpenKey("ceremony")}
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-auto hidden min-h-0 pt-2 lg:[@media(min-height:700px)]:flex"
            >
              <Illustration name="cafe" className="h-full max-h-44 w-auto" />
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

        {/* ---- bottom strip: place / time / contact ---- */}
        <div
          className="flex flex-none items-end justify-center gap-8 crayon-rule-t px-4 py-2.5 text-[#2B2522] sm:gap-14 sm:py-3"
          style={{ backgroundColor: "#F5E9D7" }}
        >
          {[
            { key: "place", label: "place", icon: <MapPin className="h-6 w-auto" />, target: "ceremony" },
            { key: "time", label: "time", icon: <ClockFace className="h-6 w-auto" />, target: "date" },
            { key: "contact", label: "contact", icon: <Phone className="h-6 w-auto" />, target: "contact" },
          ].map((item, i) => (
            <motion.button
              key={item.key}
              onClick={() => setOpenKey(item.target)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="flex flex-col items-center gap-0.5"
            >
              {item.icon}
              <span className="font-heading text-sm sm:text-base">{item.label}</span>
            </motion.button>
          ))}
          <motion.button
            onClick={() => setOpenKey("couple")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            whileHover={{ y: -4 }}
            aria-label="Tentang mempelai"
            className="hidden text-[#2B2522]/60 sm:block"
          >
            <Rings className="h-9 w-auto" delay={1.4} />
          </motion.button>
        </div>
      </motion.div>

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
