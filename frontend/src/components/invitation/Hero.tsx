"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ExternalLink, X } from "lucide-react";
import type { InvitationData, Settings } from "@/lib/types";
import { usePortalRoot } from "../ThemeProvider";
import { CHROME, INK, PAPER, TONES, type ToneKey } from "./floTone";
import {
  BookArt,
  BrushBackdrop,
  CalendarArt,
  CameraArt,
  ClockIcon,
  FloDefs,
  GiftArt,
  HeartArt,
  PeopleArt,
  PhoneIcon,
  PinIcon,
  RingsArt,
  SofaArt,
} from "./HeroDoodles";
import {
  CeremonyPanel,
  ContactPanel,
  CouplePanel,
  DatePanel,
  GalleryPanel,
  GuestPanel,
  RegistryPanel,
  StoryPanel,
} from "./PortalPanels";

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

function useCountdown(target: string) {
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(
    null
  );

  useEffect(() => {
    const date = parseDate(target);
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
  }, [target]);

  return left;
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
  /** only the six keys with `onBoard` sit on the sticker grid */
  onBoard?: boolean;
  detail: ReactNode;
  actions: CardAction[];
};

function buildCards(data: InvitationData): CardDef[] {
  const { settings, story, gallery } = data;
  const face = calendarFace(settings.wedding_date);
  const gcal = calendarUrl(settings);
  const maps = settings.resepsi_maps_url || settings.akad_maps_url;

  return [
    {
      key: "date",
      tone: "mauve",
      title: "The Date",
      subtitle: "Tandai harinya",
      tilt: -2.2,
      onBoard: true,
      art: <CalendarArt day={face.day} month={face.month} className="h-20 w-auto" />,
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
      art: <HeartArt className="h-16 w-auto" />,
      detail: <CeremonyPanel settings={settings} />,
      actions: [
        ...(maps ? [{ label: "Buka peta lokasi", href: maps }] : []),
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
      art: <GiftArt className="h-16 w-auto" />,
      detail: <RegistryPanel settings={settings} />,
      actions: [{ label: "Kembali ke RSVP", card: "rsvp" }],
    },
    {
      key: "gallery",
      tone: "teal",
      title: "Explore Venue",
      subtitle: "View photo gallery",
      tilt: 2.4,
      onBoard: true,
      art: <CameraArt className="h-16 w-auto" />,
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
      art: <BookArt className="h-16 w-auto" />,
      detail: <StoryPanel story={story} />,
      actions: [{ label: "Lihat galeri", card: "gallery" }],
    },
    {
      key: "rsvp",
      tone: "magenta",
      title: "Guest List",
      subtitle: "Manage invitations",
      tilt: 1.8,
      onBoard: true,
      art: <PeopleArt className="h-16 w-auto" />,
      detail: <GuestPanel />,
      actions: [{ label: "Info hadiah", card: "registry" }],
    },
    {
      key: "couple",
      tone: "mauve",
      title: "The Couple",
      subtitle: "Mempelai",
      tilt: 0,
      art: <RingsArt className="h-14 w-auto" />,
      detail: <CouplePanel settings={settings} />,
      actions: [{ label: "Kisah kami", card: "story" }],
    },
    {
      key: "contact",
      tone: "teal",
      title: "Contact",
      subtitle: "Sapa kami",
      tilt: 0,
      art: <PhoneIcon className="h-12 w-auto" />,
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
      className="group relative flex h-full min-h-0 flex-col items-center justify-start gap-1 rounded-[14px] border-[2.5px] px-3 py-2.5 text-center"
      style={{
        background: tone.bg,
        borderColor: tone.edge,
        color: tone.ink,
        boxShadow: `4px 5px 0 0 ${tone.edge}`,
      }}
    >
      <span className="font-heading text-base leading-tight sm:text-xl">{card.title}</span>
      <span className="font-eyebrow text-[8px] uppercase opacity-70 sm:text-[9px]">
        {card.subtitle}
      </span>
      <span className="mt-auto hidden w-full items-end justify-center pt-1 [@media(min-height:640px)]:flex">
        {card.art}
      </span>
      <span className="pointer-events-none absolute bottom-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-70">
        <ArrowRight className="h-4 w-4" />
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
      className="flex w-full items-center justify-between gap-3 rounded-[12px] border-[2.5px] px-4 py-2.5 text-left"
      style={{ background: t.bg, borderColor: t.edge, color: t.ink, boxShadow: `4px 4px 0 0 ${t.edge}` }}
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
        className="absolute inset-0 bg-[#1F2933]/45 backdrop-blur-[3px]"
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
        className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-[16px] border-[3px]"
        style={{ borderColor: INK, background: PAPER, boxShadow: "10px 12px 0 0 rgba(31,41,51,0.35)" }}
      >
        {/* browser chrome */}
        <div
          className="flex flex-none items-center gap-2 border-b-[3px] px-3 py-2"
          style={{ borderColor: INK, background: CHROME }}
        >
          <span className="flex gap-1.5">
            {["#E2685C", "#EFC050", "#7FBE8F"].map((c) => (
              <span key={c} className="h-2.5 w-2.5 rounded-full border border-[#1F2933]/60" style={{ background: c }} />
            ))}
          </span>
          <span className="ml-1 flex-1 truncate rounded-full border border-[#1F2933]/30 bg-white/70 px-3 py-0.5 font-code text-[10px] text-[#1F2933]/70">
            ours.co/{card.key}
          </span>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1 text-[#1F2933] transition-transform hover:rotate-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* header strip in the card's own colour */}
        <div
          className="flex flex-none items-center justify-between gap-4 px-5 py-3"
          style={{ background: tone.bg, color: tone.ink }}
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
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[#26303A]"
        >
          {card.detail}
        </motion.div>

        {/* actions */}
        {card.actions.length > 0 && (
          <div
            className="flex flex-none flex-wrap gap-2 border-t-[3px] px-4 py-3"
            style={{ borderColor: INK, background: CHROME }}
          >
            {card.actions.map((action) =>
              action.href ? (
                <a
                  key={action.label}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1F2933] bg-white/70 px-4 py-2 font-code text-xs text-[#1F2933] transition-transform hover:-translate-y-0.5"
                >
                  {action.label} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <button
                  key={action.label}
                  onClick={() => action.card && onNavigate(action.card)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1F2933] bg-[#1F2933] px-4 py-2 font-code text-xs text-[#FFF8E1] transition-transform hover:-translate-y-0.5"
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
  const cards = useMemo(() => buildCards(data), [data]);
  const board = cards.filter((c) => c.onBoard);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const left = useCountdown(settings.wedding_date);
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
        background:
          "radial-gradient(120% 90% at 50% 0%, #FFFBEA 0%, #FDF0B4 45%, #F8DE86 100%)",
      }}
    >
      <FloDefs />
      <BrushBackdrop />

      {/* the whole invitation lives inside this one browser window */}
      <motion.div
        initial={{ opacity: 0, y: 34, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-[18px] border-[3px] bg-[#FFFBEC]/85 backdrop-blur-[2px]"
        style={{ borderColor: INK, boxShadow: "10px 12px 0 0 rgba(31,41,51,0.28)" }}
      >
        <div
          className="flex flex-none items-center gap-2 border-b-[3px] px-3 py-2"
          style={{ borderColor: INK, background: CHROME }}
        >
          <span className="flex gap-1.5">
            {["#E2685C", "#EFC050", "#7FBE8F"].map((c) => (
              <span key={c} className="h-2.5 w-2.5 rounded-full border border-[#1F2933]/60" style={{ background: c }} />
            ))}
          </span>
          <span className="ml-1 flex-1 truncate rounded-full border border-[#1F2933]/30 bg-white/70 px-3 py-0.5 font-code text-[10px] text-[#1F2933]/70">
            ours.co — your wedding portal
          </span>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 px-4 py-4 sm:px-8 sm:py-6 lg:grid-cols-12 lg:gap-8">
          {/* ---- poster column ---- */}
          <div className="flex min-h-0 flex-col lg:col-span-5">
            <h1 className="font-poster flex items-center whitespace-nowrap text-4xl leading-[0.95] text-[#1F2933] sm:text-5xl lg:text-[clamp(2.75rem,4.1vw,3.75rem)]">
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
                className="ml-2 inline-block h-9 w-[3px] bg-[#1F2933] sm:h-12 lg:h-14"
              />
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-1 font-script text-xl text-[#1F2933]/75 sm:text-2xl lg:text-3xl"
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
              className="mt-2 flex w-fit items-center gap-2 font-heading text-xl text-[#C8145F] sm:text-2xl"
            >
              {settings.groom_name || "Groom"} &amp; {settings.bride_name || "Bride"}
              <RingsArt className="h-5 w-auto" />
            </motion.button>

            {/* live countdown, in the sticker language */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              onClick={() => setOpenKey("date")}
              whileHover={{ y: -3 }}
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-[12px] border-[2.5px] border-[#D6B03C] bg-[#FBE08A] px-3 py-1.5 text-[#4A3708]"
              style={{ boxShadow: "4px 4px 0 0 #D6B03C" }}
            >
              <span className="font-eyebrow text-[9px] uppercase">save the date</span>
              <span className="font-code text-sm tabular-nums">
                {left
                  ? `${left.d}h : ${String(left.h).padStart(2, "0")}j : ${String(left.m).padStart(2, "0")}m : ${String(left.s).padStart(2, "0")}d`
                  : "—"}
              </span>
            </motion.button>

            <div className="mt-4 hidden space-y-2.5 lg:block">
              <BannerButton
                label="EXPLORE VENUE"
                sub="View photo gallery"
                tone="butter"
                delay={0.9}
                onClick={() => setOpenKey("gallery")}
              />
              <BannerButton
                label="PLANNING TIMELINE"
                sub="Track our progress"
                tone="coral"
                delay={1}
                onClick={() => setOpenKey("story")}
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-auto hidden pt-4 text-[#1F2933]/70 lg:[@media(min-height:760px)]:block"
            >
              <SofaArt className="h-24 w-auto" delay={1.2} />
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
          className="flex flex-none items-end justify-center gap-8 border-t-[3px] px-4 py-2.5 text-[#1F2933] sm:gap-14 sm:py-3"
          style={{ borderColor: INK, background: "#F3EBD3" }}
        >
          {[
            { key: "place", label: "place", icon: <PinIcon className="h-6 w-auto" />, target: "ceremony" },
            { key: "time", label: "time", icon: <ClockIcon className="h-6 w-auto" />, target: "date" },
            { key: "contact", label: "contact", icon: <PhoneIcon className="h-6 w-auto" />, target: "contact" },
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
            className="hidden text-[#1F2933]/60 sm:block"
          >
            <RingsArt className="h-9 w-auto" delay={1.4} />
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
