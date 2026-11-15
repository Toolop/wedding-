"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarHeart, ExternalLink, Gift, MapPinned, X } from "lucide-react";
import { getWishes, mediaUrl } from "@/lib/api";
import type { InvitationData, Settings, WishesResponse } from "@/lib/types";
import { CountdownClassic, useCountdown } from "./Countdown";
import { usePortalRoot } from "../ThemeProvider";
import { type IllustrationKey } from "./assets";
import { ArrowLink, BotanicalFrame, DoubleFrame, Eyebrow, Monogram, Ornament, PhotoCorners } from "./classy";
import { GalleryPanel } from "./GalleryPanel";
import { GiftPanel } from "./GiftPanel";
import { CeremonyPanel } from "./CeremonyPanel";
import { ContactPanel, CouplePanel, DatePanel, splitTime } from "./PortalPanels";
import { RsvpPanel } from "./RsvpPanel";

/* ------------------------------------------------------------- date utils */
function parseDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Google Calendar "add event" link for the wedding day. */
export function calendarUrl(settings: Settings) {
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
  title: string;
  subtitle: string;
  /** what the card shows on the board; cards without one only open from elsewhere */
  face?: ReactNode;
  /** grid placement on the board (desktop: 4 columns) */
  span?: string;
  detail: ReactNode;
  actions: CardAction[];
};

type Live = { daysLeft: number | null; rsvp: WishesResponse["summary"] | null };

const PEEK_PHOTOS: IllustrationKey[] = ["cafe", "hello", "dinner"];
const WEEK_LETTERS = ["S", "S", "R", "K", "J", "S", "M"];
const longMonth = (d: Date) => new Intl.DateTimeFormat("id-ID", { month: "long" }).format(d).toUpperCase();
const weekdayName = (d: Date) => new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(d);

/** the seven days (Monday first) of the week the wedding falls in */
function weekAround(d: Date) {
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
}

function DateFace({ wedding, daysLeft }: { wedding: Date | null; daysLeft: number | null }) {
  const left =
    daysLeft === null ? "" : daysLeft > 0 ? `${daysLeft} hari lagi` : daysLeft === 0 ? "Hari ini!" : "Sudah resmi";
  return (
    <DoubleFrame className="h-full" innerClassName="flex flex-col items-center px-2 pb-3 pt-4 text-center sm:pt-5">
      <span className="font-flourish whitespace-nowrap text-[1.45rem] leading-none text-gold-ink sm:text-[1.75rem]">Save the Date</span>
      {wedding ? (
        <>
          <span className="font-eyebrow mt-3 text-[11px] uppercase tracking-[0.25em] text-muted">{weekdayName(wedding)}</span>
          <span className="font-serif text-[3.5rem] font-medium leading-[0.95] text-brand sm:text-[4rem]">
            {String(wedding.getDate()).padStart(2, "0")}
          </span>
          <span className="font-eyebrow text-xs uppercase tracking-[0.3em] text-ink">{longMonth(wedding)}</span>
          <span className="font-serif text-xl italic text-muted">{wedding.getFullYear()}</span>
          <Ornament className="my-3" />
          <span className="grid w-full grid-cols-7 gap-0.5 text-[10px] font-semibold text-muted lg:hidden lg:[@media(min-height:780px)]:grid">
            {WEEK_LETTERS.map((l, i) => (
              <span key={i} className={i === 6 ? "text-gold-ink" : ""}>
                {l}
              </span>
            ))}
            {weekAround(wedding).map((d) => {
              const hit = d.toDateString() === wedding.toDateString();
              return (
                <span
                  key={d.getTime()}
                  className={`mx-auto grid h-5 w-5 place-items-center rounded-full text-xs font-medium leading-none ${
                    hit ? "bg-brand font-semibold text-paper" : "text-ink"
                  }`}
                >
                  {d.getDate()}
                </span>
              );
            })}
          </span>
        </>
      ) : (
        <CalendarHeart className="my-6 h-10 w-10 text-gold-ink" strokeWidth={1.2} />
      )}
      {left && <span className="mt-auto pt-3 text-xs font-medium text-muted">{left}</span>}
    </DoubleFrame>
  );
}

const hasAkad = (s: Settings) => Boolean(s.akad_date || s.akad_time || s.akad_location);

function CeremonyFace({ settings }: { settings: Settings }) {
  const rows = [
    { k: "Akad nikah", t: settings.akad_time, at: settings.akad_location },
    { k: "Resepsi", t: settings.resepsi_time, at: settings.resepsi_location },
  ].filter((e) => e.t || e.at);
  const wedding = parseDate(settings.wedding_date);
  const zone = splitTime(settings.resepsi_time || settings.akad_time).zone;
  return (
    <span className="flex h-full flex-col rounded-[6px] border border-line bg-paper p-5 text-left sm:p-6">
      <span className="flex flex-col items-center text-center">
        <span className="font-serif text-2xl font-semibold leading-[1.1] sm:text-[1.9rem]">{hasAkad(settings) ? "Akad & Resepsi" : "Resepsi"}</span>
        <span className="font-eyebrow mt-1 text-[11px] uppercase tracking-[0.25em] text-muted">Rangkaian acara</span>
      </span>
      <span className="mt-4 flex flex-col border-y border-line-soft">
        {rows.map((e, i) => (
          <span key={e.k} className={`flex gap-4 py-3 sm:gap-[18px] sm:py-4 ${i ? "border-t border-line-soft" : ""}`}>
            <span className="w-[68px] flex-none font-serif text-[1.7rem] font-medium leading-none text-brand sm:w-[76px] sm:text-[2rem]">
              {splitTime(e.t).start}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-eyebrow text-[11px] uppercase tracking-[0.25em] text-gold-ink">{e.k}</span>
              <span className="line-clamp-1 font-serif text-lg font-semibold leading-tight sm:text-xl">{e.at}</span>
            </span>
          </span>
        ))}
      </span>
      <span className="mt-auto flex items-center justify-between pt-3">
        <span className="text-xs text-muted sm:text-[13px]">
          {wedding ? new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(wedding) : ""}
          {zone ? ` · ${zone}` : ""}
        </span>
        <ArrowLink>Detail</ArrowLink>
      </span>
    </span>
  );
}

function GiftFace({ count }: { count: number }) {
  return (
    <DoubleFrame tone="blush" className="h-full" innerClassName="flex flex-col items-center px-3 pb-1 pt-5 text-center">
      <span className="font-serif text-[1.7rem] font-medium italic leading-[1.05] sm:text-3xl">Tanda Kasih</span>
      <span className="font-eyebrow mt-1 text-[10px] uppercase tracking-[0.3em] text-gold-ink">Wedding gift</span>
      <Ornament className="my-3" />
      <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-gold-soft bg-paper sm:h-[84px] sm:w-[84px]">
        <Gift className="h-8 w-8 text-gold-ink sm:h-10 sm:w-10" strokeWidth={1.2} />
      </span>
      <span className="font-serif mt-3 text-base italic leading-snug text-muted sm:text-[17px]">
        Doa restu Anda adalah karunia terindah bagi kami.
      </span>
      {count > 0 && <span className="sr-only">{count} rekening</span>}
      <span className="mt-4 flex w-full items-center justify-between border-t border-line lg:mt-auto">
        <ArrowLink className="w-full justify-between">Kirim hadiah</ArrowLink>
      </span>
    </DoubleFrame>
  );
}

function GalleryFace({ photos, total }: { photos: string[]; total: number }) {
  const [big, ...rest] = photos;
  const small = rest.slice(0, 4);
  return (
    <span className="flex h-full flex-col gap-3 rounded-[6px] border border-line bg-mist-soft p-4 text-left sm:p-5">
      <span className="flex items-end justify-between">
        <span>
          <span className="block font-serif text-2xl font-semibold leading-[1.1] sm:text-[1.9rem]">Galeri Kita</span>
          <span className="font-eyebrow block text-[11px] uppercase tracking-[0.25em] text-muted">Momen kami berdua</span>
        </span>
        <span className="flex items-center gap-3.5">
          {total > 0 && <span className="hidden text-[13px] text-muted sm:inline">{total} foto</span>}
          <ArrowLink>Lihat album</ArrowLink>
        </span>
      </span>
      {/* an open album: one print on the left page, four on the right */}
      <span className="flex min-h-0 flex-1 overflow-hidden rounded-[4px] shadow-paint-md">
        <span className="flex flex-1 flex-col items-center justify-center gap-2.5 border border-r-0 border-line bg-page p-3 shadow-[inset_-14px_0_18px_-14px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]">
          {big && (
            <PhotoCorners>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={big} alt="" className="h-32 w-28 object-cover lg:h-[clamp(5.5rem,17vh,9.5rem)] lg:w-[clamp(4.5rem,14vh,8.25rem)]" />
            </PhotoCorners>
          )}
          <span className="font-flourish text-xl leading-[1.1] text-brand lg:hidden lg:text-2xl lg:[@media(min-height:780px)]:block">
            sampai jumpa di hari H kami
          </span>
        </span>
        <span aria-hidden className="w-0.5 flex-none bg-line" />
        <span className="grid flex-1 grid-cols-2 content-center justify-items-center gap-2.5 border border-l-0 border-line bg-page p-3 shadow-[inset_14px_0_18px_-14px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]">
          {small.map((src, i) => (
            <PhotoCorners key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-14 w-14 object-cover min-[400px]:h-16 min-[400px]:w-16 lg:h-[clamp(3rem,8.5vh,5.5rem)] lg:w-[clamp(3rem,8.5vh,5.5rem)]" />
            </PhotoCorners>
          ))}
        </span>
      </span>
    </span>
  );
}

function RsvpFace({ rsvp }: { rsvp: WishesResponse["summary"] | null }) {
  const guests = rsvp?.guests ?? 0;
  return (
    <DoubleFrame tone="brand" className="h-full" innerClassName="flex flex-col items-center gap-y-1 px-3 pb-1 pt-5 text-center">
      <span className="font-serif text-[1.7rem] font-medium italic leading-[1.05] sm:text-3xl">RSVP &amp; Ucapan</span>
      <span className="font-eyebrow mt-1 text-[10px] uppercase tracking-[0.3em] text-honey">Konfirmasi kehadiran</span>
      {guests > 0 ? (
        <>
          <span className="mt-4 grid h-[104px] w-[104px] place-items-center lg:mt-auto rounded-full border border-honey/80 p-[5px] sm:h-[116px] sm:w-[116px]">
            <span className="grid h-full w-full place-items-center rounded-full border border-honey/40 font-serif text-[3.4rem] font-medium leading-none">
              {guests}
            </span>
          </span>
          <span className="font-flourish mt-2 text-[1.7rem] leading-[1.1]">tamu akan hadir</span>
          <Ornament onBrand className="mt-2" />
          {rsvp && rsvp.hadir > 0 && (
            <span className="font-eyebrow mt-2 text-[10px] uppercase tracking-[0.2em] text-on-brand-muted">
              {rsvp.hadir} sudah konfirmasi
            </span>
          )}
        </>
      ) : (
        <>
          <Ornament onBrand className="my-4" />
          <span className="font-serif px-2 text-lg italic leading-snug text-on-brand-muted">Kabari kami sebelum hari H</span>
        </>
      )}
      <span className="mt-4 w-full border-t border-honey/35 pt-0 lg:mt-auto">
        <ArrowLink onBrand className="w-full justify-between">Isi RSVP</ArrowLink>
      </span>
    </DoubleFrame>
  );
}

function buildCards(data: InvitationData, live: Live): CardDef[] {
  const { settings, gallery, gifts } = data;
  const gcal = calendarUrl(settings);
  const wedding = parseDate(settings.wedding_date);
  const accounts = gifts?.length ? gifts.length : settings.bank_name ? 1 : 0;
  const photos = gallery.length
    ? gallery.map((g) => mediaUrl(g.image_url))
    : PEEK_PHOTOS.map((n) => `/images/illustrations/${n}.jpeg`);
  return [
    {
      key: "date",
      title: "The Date",
      subtitle: "Tandai harinya",
      span: "max-lg:order-1",
      face: <DateFace wedding={wedding} daysLeft={live.daysLeft} />,
      detail: <DatePanel settings={settings} />,
      actions: [
        ...(gcal ? [{ label: "Simpan ke Google Calendar", href: gcal }] : []),
        { label: "Detail acara", card: "ceremony" },
      ],
    },
    {
      key: "ceremony",
      title: hasAkad(settings) ? "Akad & Resepsi" : "Resepsi",
      subtitle: "Rangkaian acara",
      span: "sm:col-span-2 max-lg:order-3",
      face: <CeremonyFace settings={settings} />,
      detail: <CeremonyPanel settings={settings} />,
      actions: [{ label: "Konfirmasi kehadiran", card: "rsvp" }],
    },
    {
      key: "registry",
      title: "Tanda Kasih",
      subtitle: "Wedding gift",
      span: "max-lg:order-2",
      face: <GiftFace count={accounts} />,
      detail: <GiftPanel settings={settings} gifts={gifts} />,
      actions: [{ label: "Kembali ke RSVP", card: "rsvp" }],
    },
    {
      key: "gallery",
      title: "Galeri Kita",
      subtitle: "Momen kami berdua",
      span: "sm:col-span-2 max-lg:order-4 lg:col-span-3",
      face: <GalleryFace photos={photos} total={gallery.length} />,
      detail: <GalleryPanel gallery={gallery} />,
      actions: [],
    },
    {
      key: "rsvp",
      title: "RSVP & Ucapan",
      subtitle: "Konfirmasi kehadiran",
      span: "max-lg:order-5 sm:max-lg:col-span-2",
      face: <RsvpFace rsvp={live.rsvp} />,
      detail: <RsvpPanel />,
      actions: [{ label: "Info hadiah", card: "registry" }],
    },
    {
      key: "couple",
      title: "Mempelai",
      subtitle: "The couple",
      detail: <CouplePanel settings={settings} />,
      actions: [],
    },
    {
      key: "contact",
      title: "Kontak",
      subtitle: "Sapa kami",
      detail: <ContactPanel settings={settings} />,
      actions: [{ label: "Konfirmasi kehadiran", card: "rsvp" }],
    },
  ];
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
      <motion.div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-[6px] border border-line bg-paper shadow-paint-lg"
      >
        <div className="relative flex-none border-b border-line px-5 pb-4 pt-5 text-center">
          <Eyebrow className="justify-center">{card.subtitle}</Eyebrow>
          <h3 className="mt-1 font-serif text-3xl font-semibold leading-[1.1]">{card.title}</h3>
          <Ornament className="mt-3" />
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-chrome"
          >
            <X className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>

        {/* body: the only place scrolling is allowed */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-ink"
        >
          {card.detail}
        </motion.div>

        {card.actions.length > 0 && (
          <div className="flex flex-none flex-wrap gap-2 border-t border-line bg-chrome px-4 py-3">
            {card.actions.map((action) =>
              action.href ? (
                <a
                  key={action.label}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-paper px-5 font-code text-[13px] text-ink transition-colors hover:border-gold"
                >
                  {action.label} <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.6} />
                </a>
              ) : (
                <button
                  key={action.label}
                  onClick={() => action.card && onNavigate(action.card)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand px-5 font-code text-[13px] text-on-brand transition-colors hover:bg-brand-hover"
                >
                  {action.label}
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
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Hero({ data }: { data: InvitationData }) {
  const { settings } = data;
  const left = useCountdown(settings.wedding_date);
  // -1 once the moment has passed, so the card can say "Sudah resmi"
  const daysLeft = left ? (left.done ? -1 : left.d) : null;
  const [rsvp, setRsvp] = useState<WishesResponse["summary"] | null>(null);
  useEffect(() => {
    getWishes(1, 1)
      .then((res) => setRsvp(res.summary))
      .catch(() => undefined);
  }, []);
  const cards = useMemo(() => buildCards(data, { daysLeft, rsvp }), [data, daysLeft, rsvp]);
  const board = cards.filter((c) => c.face);
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

  const groom = settings.groom_name || "Groom";
  const bride = settings.bride_name || "Bride";
  const gcal = calendarUrl(settings);
  const longDate = wedding
    ? new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
        .format(wedding)
        .toUpperCase()
    : "";
  const weekday = wedding ? weekdayName(wedding) : "";
  const monthShort = wedding ? new Intl.DateTimeFormat("id-ID", { month: "short" }).format(wedding) : "";

  const parties = [
    { name: groom, full: settings.groom_full_name, parents: settings.groom_parents, img: settings.groom_photo, label: "Mempelai pria" },
    { name: bride, full: settings.bride_full_name, parents: settings.bride_parents, img: settings.bride_photo, label: "Mempelai wanita" },
  ];

  return (
    <section className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-page lg:h-[100dvh]">
      <BotanicalFrame />

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col px-4 pb-6 pt-[4.5rem] sm:px-8 sm:pt-8 lg:px-14 lg:pb-3 lg:pt-8">
        <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:gap-10">
          {/* ---- left: the invitation itself ---- */}
          <div className="flex min-h-0 flex-col gap-3 [@media(min-height:860px)]:gap-[18px]">
            <motion.div {...rise(0.1)}>
              <Eyebrow rule className="tracking-[0.35em]">The wedding of</Eyebrow>
            </motion.div>

            <motion.button
              onClick={() => setOpenKey("couple")}
              {...rise(0.2)}
              aria-label={`${groom} & ${bride}, tentang mempelai`}
              className="flex w-fit items-baseline gap-3 text-left font-serif font-medium leading-none tracking-[-0.02em] text-ink text-[clamp(2.75rem,15vw,3.75rem)] lg:text-[clamp(3.5rem,min(7vw,10.5vh),6.5rem)]"
            >
              <span>{groom}</span>
              <span className="font-flourish text-[0.85em] font-normal tracking-normal text-gold">&amp;</span>
              <span>{bride}</span>
            </motion.button>

            <motion.p {...rise(0.3)} className="font-script -mt-1 text-xl leading-snug text-muted lg:text-2xl">
              Dengan penuh cinta, kami mengundang Anda untuk hadir di hari bahagia kami.
            </motion.p>

            <motion.button
              type="button"
              onClick={() => setOpenKey("couple")}
              {...rise(0.4)}
              whileHover={{ y: -2 }}
              aria-label="Kenalan dengan mempelai"
              className="block w-full text-left"
            >
              <DoubleFrame innerClassName="grid grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] items-center px-2 py-3 text-center sm:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] sm:px-3 sm:py-3.5">
                {[parties[0], null, parties[1]].map((p, i) =>
                  p === null ? (
                    <span key={i} aria-hidden className="flex flex-col items-center gap-1.5 self-stretch">
                      <span className="w-px flex-1 bg-line" />
                      <span className="font-flourish text-4xl leading-none text-gold">&amp;</span>
                      <span className="w-px flex-1 bg-line" />
                    </span>
                  ) : (
                    <span key={i} className="flex min-w-0 flex-col items-center gap-0.5">
                      <span className="mb-1.5 h-[60px] w-[60px] overflow-hidden rounded-full border border-gold p-[3px]">
                        {p.img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl(p.img)} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center rounded-full bg-chrome font-serif text-lg text-brand">
                            {(p.name || "?").charAt(0)}
                          </span>
                        )}
                      </span>
                      <span className="font-eyebrow text-[10px] uppercase tracking-[0.25em] text-gold-ink">{p.label}</span>
                      <span className="line-clamp-2 font-serif text-lg font-semibold leading-[1.1] sm:text-[22px]">{p.full || p.name}</span>
                      {p.parents && <span className="line-clamp-2 text-xs leading-snug text-muted">{p.parents}</span>}
                    </span>
                  ),
                )}
              </DoubleFrame>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setOpenKey("date")}
              {...rise(0.5)}
              whileHover={{ y: -2 }}
              aria-label="Hitung mundur, buka detail tanggal"
              className="block w-full text-left"
            >
              <DoubleFrame tone="brand" innerClassName="flex flex-col items-center gap-2.5 px-4 py-3.5 sm:px-6">
                <span className="flex w-full items-center justify-center gap-3">
                  <span aria-hidden className="h-px w-8 bg-honey" />
                  <span className="font-eyebrow text-[11px] uppercase tracking-[0.3em] text-honey">Menuju hari bahagia</span>
                  <span aria-hidden className="h-px w-8 bg-honey" />
                </span>
                <CountdownClassic target={settings.wedding_date} />
                <span className="font-code text-center text-xs font-medium uppercase tracking-[0.15em] text-on-brand-muted">
                  {longDate}
                  {venue ? ` ◆ ${venue}` : ""}
                </span>
              </DoubleFrame>
            </motion.button>

            <motion.div {...rise(0.6)} className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setOpenKey("rsvp")}
                className="block w-full rounded-[6px] border border-line bg-paper p-1.5 text-left transition-transform hover:-translate-y-0.5"
              >
                <span className="relative flex flex-col items-center gap-1 rounded-[3px] border border-gold-soft bg-brand px-12 py-3 text-center text-on-brand">
                  <span className="flex items-center gap-3.5">
                    <span aria-hidden className="hidden h-px w-7 bg-honey sm:block" />
                    <span className="font-serif text-2xl font-medium italic leading-[1.05] sm:text-[27px]">Konfirmasi Kehadiran</span>
                    <span aria-hidden className="hidden h-px w-7 bg-honey sm:block" />
                  </span>
                  <span className="font-eyebrow text-[10px] uppercase tracking-[0.3em] text-honey">Kabari kami sebelum hari H</span>
                  <svg aria-hidden width="26" height="12" viewBox="0 0 28 14" fill="none" strokeWidth="1.3" strokeLinecap="round" className="absolute right-5 top-1/2 -mt-1.5 stroke-honey">
                    <path d="M1 7h25M20 1l6 6-6 6" />
                  </svg>
                </span>
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpenKey("ceremony")}
                  className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full border border-line bg-paper font-code text-sm transition-colors hover:border-gold"
                >
                  <MapPinned className="h-4 w-4 text-brand" strokeWidth={1.5} /> Lihat Lokasi
                </button>
                {gcal && (
                  <a
                    href={gcal}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full border border-line bg-paper font-code text-sm transition-colors hover:border-gold"
                  >
                    <CalendarHeart className="h-4 w-4 text-brand" strokeWidth={1.5} /> Simpan Tanggal
                  </a>
                )}
              </div>
            </motion.div>
          </div>

          {/* ---- right: the board ---- */}
          <div className="grid min-h-0 auto-rows-auto grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-4">
            {board.map((card, i) => (
              <motion.button
                key={card.key}
                type="button"
                onClick={() => setOpenKey(card.key)}
                aria-label={card.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                className={`block h-full min-h-0 text-left ${card.span ?? ""}`}
              >
                {card.face}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- footer: monogram, place / time / contact ---- */}
      <footer className="relative z-10 flex flex-none flex-wrap items-center gap-x-7 gap-y-2 border-t border-line bg-chrome px-5 py-3 sm:px-8 lg:h-[76px] lg:flex-nowrap lg:px-14 lg:py-0">
        <button onClick={() => setOpenKey("couple")} aria-label="Tentang mempelai" className="flex flex-none items-center gap-3">
          <Monogram a={groom.charAt(0)} b={bride.charAt(0)} size={60} />
          <span className="font-flourish text-[1.75rem] leading-none text-brand">
            {groom} &amp; {bride}
          </span>
        </button>
        <div className="flex min-w-0 flex-1 items-stretch justify-end gap-5 sm:gap-9 sm:pr-16 lg:pr-20">
          {[
            { key: "place", label: "Lokasi", value: venue || "Lihat peta", target: "ceremony" },
            { key: "time", label: "Waktu", value: wedding ? `${weekday}, ${wedding.getDate()} ${monthShort} ${wedding.getFullYear()}` : "Tanggal", target: "date" },
            { key: "contact", label: "Kontak", value: "Sapa kami", target: "contact" },
          ].map((item, i) => (
            <button
              key={item.key}
              onClick={() => setOpenKey(item.target)}
              className={`flex min-w-0 flex-col gap-0.5 text-left ${i ? "border-l border-line pl-5 sm:pl-9" : ""} ${i === 0 ? "max-sm:hidden" : ""}`}
            >
              <span className="font-eyebrow text-[11px] uppercase tracking-[0.25em] text-gold-ink">{item.label}</span>
              <span className="truncate font-serif text-base font-semibold sm:text-lg">{item.value}</span>
            </button>
          ))}
        </div>
      </footer>

      {/* portalled so pop-ups escape the hero's stacking context */}
      {portalRoot &&
        createPortal(
          <AnimatePresence>
            {openCard && <PopupWindow key={openCard.key} card={openCard} onClose={close} onNavigate={navigate} />}
          </AnimatePresence>,
          portalRoot
        )}
    </section>
  );
}
