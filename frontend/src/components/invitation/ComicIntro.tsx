"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useAnimate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { ChevronLeft, ChevronRight, Mail, Play } from "lucide-react";
import { parseDate } from "@/lib/dates";
import type { Settings } from "@/lib/types";
import { AnswerArt, AnswerInset, useAnswer } from "./Answer";
import { Frame, Stage } from "./chapterKit";
import { ComifuroArt, ComifuroInset, useComifuro } from "./Comifuro";
import { ConfessArt, ConfessInset, useConfess } from "./Confess";
import { FindUsArt, FindUsInset, useFindUs } from "./FindUs";
import { BotanicalCorner, BotanicalFrame, DoubleFrame, Eyebrow, Ornament } from "./classy";
import { GbkArt, GbkInset, useGbk } from "./Gbk";
import { LunchArt, LunchInset, useLunch } from "./Lunch";
import { MovieArt, MovieInset, useMovie } from "./Movie";
import WakeUp from "./WakeUp";
import { colors } from "./theme";
import { IMG } from "./assets";

/*
 * A "Florence"-style interactive comic: one framed panel at a time, a small
 * inset panel pops over its bottom edge with a tiny thing to do (tap, scrub,
 * hold), and finishing it lets you swipe the camera sideways to the next
 * panel — past a flip counter that ticks as the strip slides by.
 */

type SceneKind =
  | "cover"
  | "findus"
  | "lunch"
  | "gbk"
  | "comifuro"
  | "movie"
  | "confess"
  | "answer"
  | "wedding";

type Scene = {
  key: SceneKind;
  tag: { title: string; chapter: string };
  caption: string;
  /** show the caption before the inset is finished (the last panel) */
  captionFirst?: boolean;
  /** the day this chapter happened (the cover has none) */
  date?: string;
  accent?: boolean;
};

/** a calendar between two panels that rolls from one story date to the next */
type Interlude = { from: Date; to: Date; label: string };
type Milestone = { date: Date; label: string };

const pad = (n: number, len = 2) => String(Math.max(0, n)).padStart(len, "0");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

/** a chapter's day: plain "YYYY-MM-DD" is read as a local calendar day, anything else as a timestamp */
function chapterDay(value: string) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : (parseDate(value) ?? new Date());
}

function buildStory(settings: Settings): { scenes: Scene[]; interludes: Interlude[] } {
  const groom = settings.groom_name || "Dia";
  const bride = settings.bride_name || "Dia";

  const scenes: Scene[] = [
    {
      key: "cover",
      tag: { title: "Sebuah Kisah", chapter: "Chapter 01" },
      caption: "Dari rekan kerja, menjadi teman cerita, hingga akhirnya bersama selamanya.",
    },
    {
      key: "findus",
      tag: { title: "Awal Pertemuan", chapter: "Chapter 02" },
      date: "2024-04-01",
      caption: `Semua berawal di Sucofindo. ${bride} bergabung lebih dahulu, hingga sebulan kemudian ${groom} menyusul. Saat itu, mereka hanyalah dua orang rekan kerja yang belum saling mengenal. Belum ada yang menyangka bahwa pertemuan sederhana ini akan menjadi awal dari sebuah cerita panjang.`,
    },
    {
      key: "lunch",
      tag: { title: "Makan Siang Pertama", chapter: "Chapter 03" },
      // the couple said "31 April"; April ends on the 30th
      date: "2024-04-30",
      caption: `Kala itu, ${groom} masih malu-malu dan hampir tidak pernah makan siang bersama teman-teman kantor. Melihat hal itu, ${bride} akhirnya mengajak ${groom} makan siang bersama, karena kasihan melihatnya hanya duduk saat istirahat. Dari ajakan sederhana tersebut, mereka pun mulai mengobrol dan mengenal satu sama lain.`,
    },
    {
      key: "gbk",
      tag: { title: "Semakin Dekat", chapter: "Chapter 04" },
      caption: `${bride} kemudian mengajak ${groom} berolahraga bersama teman-teman kantor di GBK. Dari kegiatan bersama itu, kedekatan mereka mulai tumbuh. Di momen inilah ${groom} mulai mengikuti Instagram ${bride}, menjadi salah satu langkah kecil dalam perjalanan mereka untuk saling mengenal lebih jauh.`,
      date: "2024-05-10",
    },
    {
      key: "comifuro",
      tag: { title: "Hobi yang Sama", chapter: "Chapter 05" },
      caption: `Ternyata, mereka memiliki hobi yang sama, yaitu menyukai dunia anime. ${bride} pun mengajak ${groom} dan teman-teman lainnya untuk datang ke festival anime, Comifuro. Hari itu menjadi momen yang berkesan karena untuk pertama kalinya mereka banyak mengobrol dan pulang bersama naik kereta. Sebuah perjalanan pulang yang sederhana, tetapi menjadi bagian manis dari kisah mereka.`,
      date: "2024-05-11",
    },
    {
      key: "movie",
      tag: { title: "Nonton Berdua", chapter: "Chapter 06" },
      caption: `Setelah semakin sering mengobrol, bertukar pesan, dan menghabiskan waktu bersama, ${groom} akhirnya memberanikan diri mengajak ${bride} pergi berdua. Film Look Back menjadi pilihan mereka untuk menghabiskan waktu bersama. Dari sana, hubungan yang awalnya hanya sebatas rekan kerja perlahan berkembang menjadi sesuatu yang lebih istimewa.`,
      date: "2024-08-10",
    },
    {
      key: "confess",
      tag: { title: "Sebuah Pengakuan", chapter: "Chapter 07" },
      caption: `Di dalam TransJakarta, ${groom} akhirnya mengumpulkan keberanian untuk mengungkapkan perasaannya kepada ${bride}. Berbekal cokelat SilverQueen dan keberanian yang sudah dikumpulkan, ${groom} menyatakan isi hatinya—lalu langsung kabur karena gugup! Momen yang sederhana sekaligus menggemaskan ini menjadi salah satu kenangan yang tak terlupakan.`,
      date: "2024-08-10",
    },
    {
      key: "answer",
      tag: { title: "Sebuah Jawaban", chapter: "Chapter 08" },
      caption: `Setelah percakapan panjang, ${bride} akhirnya menerima perasaan ${groom}. Tanggal 31 Agustus 2024, di Pesta Buku Taman Ismail Marzuki, menjadi awal resmi perjalanan mereka sebagai pasangan. Sejak hari itu, mereka mulai menulis cerita bersama, melewati suka dan duka, serta belajar untuk terus tumbuh berdampingan.`,
      date: "2024-08-31",
      accent: true,
    },
    {
      key: "wedding",
      tag: { title: "Forever Begins", chapter: "Chapter 09" },
      caption:
        "Dua tahun telah berlalu sejak kisah mereka resmi dimulai. Dari pertemuan di kantor, makan siang pertama, perjalanan pulang naik kereta, hingga pengakuan cinta yang penuh keberanian, setiap momen telah membawa mereka ke titik ini. Dan akhirnya, tibalah saatnya untuk membuka babak baru. Bukan lagi sekadar menjadi dua orang yang saling menemukan, tetapi dua hati yang memilih untuk berjalan bersama, membangun rumah, dan menghabiskan sisa hidup berdampingan.",
      captionFirst: true,
      date: settings.wedding_date,
      accent: true,
    },
  ];

  // panel k (k ≥ 1) sits on its chapter's day
  const milestones: Milestone[] = scenes
    .slice(1)
    .map((s) => ({ date: chapterDay(s.date ?? ""), label: s.tag.title }));
  // the first calendar rolls in from a year earlier
  const first = milestones[0].date;
  const interludes: Interlude[] = milestones.map((m, i) => ({
    from: i === 0 ? new Date(first.getFullYear() - 1, first.getMonth(), 1) : milestones[i - 1].date,
    to: m.date,
    label: m.label,
  }));

  return { scenes, interludes };
}

/* ------------------------------------------------------------ window size */

function subscribeResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
const useViewport = () => ({
  w: useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 0),
  h: useSyncExternalStore(subscribeResize, () => window.innerHeight, () => 0),
});

/* ---------------------------------------------------------------- caption */

/** Reveal a caption word-by-word for a hand-written, storybook cadence. */
function StoryCaption({ text }: { text: string }) {
  return (
    <motion.p
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: text.length > 360 ? 0.015 : text.length > 160 ? 0.025 : 0.04, delayChildren: 0.25 }}
      // a long chapter text gets a smaller hand so it still fits under the panel
      className={`px-6 text-center font-script leading-snug text-ink/90 ${
        text.length > 360
          ? "max-w-xl text-base leading-tight sm:text-xl"
          : text.length > 160
            ? "max-w-md text-lg leading-tight sm:text-2xl"
            : "max-w-sm text-2xl sm:text-3xl"
      }`}
    >
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="inline-block"
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </motion.p>
  );
}

/* ------------------------------------------------------------- inset kit */

type InsetProps = {
  done: boolean;
  onDone: () => void;
  onFlash: () => void;
  onFinish: () => void;
};

/** the small pop-over panel; `progress` draws a thin gold-ruled meter above it */
function InsetCard({ children, progress }: { children: ReactNode; progress?: number }) {
  return (
    <div className="relative h-full w-full">
      {progress !== undefined && (
        <div className="absolute -top-5 left-[8%] right-[8%] h-[3px] overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-brand"
            style={{ originX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ type: "tween", duration: 0.25 }}
          />
        </div>
      )}
      <div className="relative h-full w-full overflow-hidden rounded-[4px] border border-gold-soft bg-paper shadow-paint-md">
        {children}
      </div>
    </div>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <span className="font-eyebrow pointer-events-none whitespace-nowrap text-[10px] uppercase tracking-[0.3em] text-muted">{children}</span>
  );
}

/** cover: a round play button riding the card's bottom edge, its label underneath */
function HeartInset({ done, onDone }: InsetProps) {
  return (
    <button
      type="button"
      onClick={() => !done && onDone()}
      aria-label="Mulai cerita"
      className="flex w-[280px] flex-col items-center gap-3"
    >
      <span className="grid h-[88px] w-[88px] place-items-center rounded-full border border-gold bg-page p-[5px] shadow-paint-md">
        <motion.span
          animate={done ? { scale: [1, 1.1, 1] } : { scale: [1, 1.04, 1] }}
          transition={done ? { duration: 0.5 } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="grid h-full w-full place-items-center rounded-full border border-honey bg-brand"
        >
          <Play className="ml-0.5 h-[22px] w-[22px] fill-on-brand text-on-brand" strokeWidth={0} />
        </motion.span>
      </span>
      <span className="flex items-center gap-3">
        <span aria-hidden className="h-px w-7 bg-gold" />
        <span className="whitespace-nowrap font-serif text-[1.6rem] font-medium italic leading-none text-ink">Mulai Cerita</span>
        <span aria-hidden className="h-px w-7 bg-gold" />
      </span>
      <Hint>{done ? "dimulai…" : "klik untuk memulai"}</Hint>
    </button>
  );
}

/** finale: tap the envelope to open the invitation */
function EnvelopeInset({ done, onDone, onFinish }: InsetProps) {
  const open = () => {
    if (done) return;
    onDone();
    window.setTimeout(onFinish, 1100);
  };
  return (
    <InsetCard>
      <button
        type="button"
        onClick={open}
        aria-label="Buka amplop undangan"
        className="relative flex h-full w-full items-center justify-center gap-4"
      >
        <motion.span
          animate={done ? { y: -6, scale: 1.1 } : { y: [0, -2, 0] }}
          transition={done ? { duration: 0.6 } : { duration: 2.2, repeat: Infinity }}
          className="grid aspect-square h-[62%] place-items-center rounded-full border border-gold-soft bg-page text-gold-ink"
        >
          <Mail className="h-1/2 w-1/2" strokeWidth={1.3} />
        </motion.span>
        <div className="flex flex-col items-start gap-1">
          <span className="font-script text-xl leading-none text-ink sm:text-2xl">Buka Undangan</span>
          <Hint>{done ? "membuka…" : "klik untuk membuka"}</Hint>
        </div>
      </button>
    </InsetCard>
  );
}

/* ----------------------------------------------------------------- panels */

function CoverArt({ groom, bride }: { groom: string; bride: string }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-page px-6 pb-[16%] text-center">
      <Eyebrow className="absolute left-4 top-4 !text-[10px] !text-muted">Chapter I</Eyebrow>
      <Eyebrow className="absolute right-4 top-4 !text-[10px] !text-muted">Sebuah kisah</Eyebrow>
      <span className="font-serif text-2xl italic leading-none tracking-[0.1em] text-muted sm:text-3xl">Our</span>
      <h1 className="font-flourish text-[clamp(3.2rem,12vw,5.5rem)] leading-[1.05] text-brand">Love Story</h1>
      <Ornament className="mt-1" />
      <p className="mt-3 whitespace-nowrap font-serif text-xl font-semibold text-ink sm:text-2xl">
        {groom} <span className="font-flourish font-normal text-gold">&amp;</span> {bride}
      </p>
    </div>
  );
}

/** the last panel: the wedding drawing, framed by two line-drawn sprigs */
function WeddingArt() {
  return (
    <Stage>
      <Frame src={IMG.wedding} position="50% 40%" />
      <BotanicalCorner className="-left-6 -top-6 h-24 w-28 sm:h-32 sm:w-36" />
      <BotanicalCorner tone="rose" className="-bottom-6 -right-6 h-24 w-28 rotate-180 sm:h-32 sm:w-36" />
    </Stage>
  );
}

/* --------------------------------------------------------------- chapters */

/** each chapter fills the panel's two slots: the picture, and the inset hanging below it */
type ChapterProps = InsetProps & {
  present: boolean;
  groom: string;
  bride: string;
  children: (art: ReactNode, inset: ReactNode) => ReactNode;
};

const CHAPTERS: Record<SceneKind, (p: ChapterProps) => ReactNode> = {
  cover: (p) => p.children(<CoverArt groom={p.groom} bride={p.bride} />, <HeartInset {...p} />),
  findus: function FindUsChapter(p) {
    const game = useFindUs(p);
    return p.children(
      <FindUsArt game={game} active={p.present && !p.done} />,
      <InsetCard>
        <FindUsInset game={game} done={p.done} />
      </InsetCard>,
    );
  },
  lunch: function LunchChapter(p) {
    const game = useLunch(p);
    return p.children(
      <LunchArt game={game} active={p.present} />,
      <InsetCard>
        <LunchInset game={game} />
      </InsetCard>,
    );
  },
  gbk: function GbkChapter(p) {
    const game = useGbk(p);
    return p.children(
      <GbkArt game={game} />,
      <InsetCard>
        <GbkInset game={game} />
      </InsetCard>,
    );
  },
  comifuro: function ComifuroChapter(p) {
    const game = useComifuro(p);
    return p.children(
      <ComifuroArt game={game} active={p.present} />,
      <InsetCard>
        <ComifuroInset game={game} />
      </InsetCard>,
    );
  },
  movie: function MovieChapter(p) {
    const game = useMovie(p);
    return p.children(
      <MovieArt game={game} active={p.present} />,
      <InsetCard>
        <MovieInset game={game} />
      </InsetCard>,
    );
  },
  confess: function ConfessChapter(p) {
    const game = useConfess(p);
    return p.children(
      <ConfessArt game={game} />,
      <InsetCard>
        <ConfessInset game={game} />
      </InsetCard>,
    );
  },
  answer: function AnswerChapter(p) {
    const game = useAnswer(p);
    return p.children(
      <AnswerArt game={game} />,
      <InsetCard>
        <AnswerInset game={game} />
      </InsetCard>,
    );
  },
  wedding: (p) => p.children(<WeddingArt />, <EnvelopeInset {...p} />),
};

function ScenePanel({
  scene,
  settings,
  present,
  done,
  nudge,
  onDone,
  onFinish,
}: {
  scene: Scene;
  settings: Settings;
  /** this is the panel on screen and the camera has stopped on it */
  present: boolean;
  done: boolean;
  nudge: number;
  onDone: () => void;
  onFinish: () => void;
}) {
  const [flash, setFlash] = useState(0);
  const [scope, shake] = useAnimate();
  const groom = settings.groom_name || "Dia";
  const bride = settings.bride_name || "Dia";

  // swiping ahead before the inset is finished wiggles it as a cue
  useEffect(() => {
    if (nudge && scope.current) shake(scope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.45 });
  }, [nudge, scope, shake]);

  const Chapter = CHAPTERS[scene.key];
  const isCover = scene.key === "cover";
  const isFind = scene.key === "findus";

  return (
    <Chapter
      done={done}
      onDone={onDone}
      onFinish={onFinish}
      onFlash={() => setFlash((f) => f + 1)}
      present={present}
      groom={groom}
      bride={bride}
    >
      {(art, inset) => (
        <>
          <div className="relative" style={{ width: "var(--panel)", height: "var(--panel-h, var(--panel))" }}>
            <div className="h-full w-full rounded-[6px] border border-line bg-paper p-[8px] shadow-paint-sm">
              <div className="relative h-full w-full overflow-hidden rounded-[3px] border border-gold-soft bg-page">
                {art}
                {/* camera flash */}
                <motion.div
                  key={flash}
                  className="pointer-events-none absolute inset-0 bg-white"
                  initial={{ opacity: flash ? 0.95 : 0 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* the prologue note beside the cover card (wide screens) */}
            {isCover && (
              <div className="absolute right-full top-[46%] mr-24 hidden w-[220px] flex-col gap-3.5 text-left xl:flex">
                <Eyebrow>Prolog</Eyebrow>
                <span aria-hidden className="h-px w-10 bg-gold" />
                <p className="font-script text-2xl leading-[1.35] text-muted">Setiap kisah punya awal. Inilah awal kisah kami.</p>
              </div>
            )}

            {/* chapter name tag over the panel's corner */}
            {!isCover && <motion.div
              initial={false}
              animate={present ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{ delay: present ? 0.15 : 0, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -left-3 top-[7%] z-10 rounded-[3px] border border-gold-soft bg-paper px-4 py-2 text-center shadow-paint-sm"
            >
              <p className="font-serif text-base font-semibold leading-tight text-ink sm:text-lg">{scene.tag.title}</p>
              <p className="font-eyebrow text-[11px] uppercase tracking-[0.25em] text-gold-ink">{scene.tag.chapter}</p>
            </motion.div>}

            {/* the interactive inset hangs off the bottom edge */}
            <div ref={scope} className={`absolute inset-x-0 z-20 flex justify-center ${isCover ? "top-full -mt-11" : isFind ? "top-full mt-3" : "top-[80%]"}`}>
              <AnimatePresence>
                {present && (
                  <motion.div
                    initial={{ opacity: 0, y: 26, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 20 }}
                    className="relative"
                    style={
                      isCover
                        ? undefined
                        : isFind
                          ? { width: "calc(var(--panel) * 0.96)" }
                          : { width: "calc(var(--panel) * 0.74)", height: "calc(var(--panel) * 0.34)" }
                    }
                  >
                    {inset}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div
            className="flex items-start justify-center"
            style={{ height: "var(--below)", paddingTop: "var(--cap-pad, calc(var(--panel) * 0.17 + 14px))" }}
          >
            {(done || scene.captionFirst) && present && <StoryCaption text={scene.caption} />}
          </div>
        </>
      )}
    </Chapter>
  );
}

/* --------------------------------------------------------- calendar roll */

/** one flipping figure of the date: serif numerals that drop in over the old one */
function FlapTile({ value, wide = false }: { value: string; wide?: boolean }) {
  // a fresh key per flip: reusing the value as key gets stuck blank when a
  // digit flips away and straight back while its old copy is still exiting
  const [flip, setFlip] = useState({ value, n: 0 });
  if (flip.value !== value) setFlip({ value, n: flip.n + 1 });

  return (
    <span
      className={`relative inline-flex h-14 items-center justify-center overflow-hidden font-serif font-medium text-brand [perspective:220px] sm:h-[4.25rem] ${
        wide ? "min-w-[4.5rem] px-1 text-[1.7rem] tracking-[0.18em] sm:min-w-[5.5rem] sm:text-[2rem]" : "w-[1.7rem] text-[2.9rem] sm:w-9 sm:text-[3.5rem]"
      }`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={flip.n}
          initial={{ rotateX: -85, y: "-28%", opacity: 0.4 }}
          animate={{ rotateX: 0, y: 0, opacity: 1 }}
          exit={{ rotateX: 85, y: "28%", opacity: 0, transition: { duration: 0.12 } }}
          transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="block leading-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;

type Sheet = { id: number; label: string; dx: number; dy: number; rot: number };
type Ymd = { day: number; month: number; year: number };

/**
 * A desk calendar between two panels. As the camera slides over
 * [start, center] it rolls from `from` to `to` — fast at first, then the last
 * days tick over one by one — tearing off a page each time the month turns.
 * When the camera rests on it, the date gets circled in red crayon.
 */
function CalendarRoll({
  cam,
  start,
  center,
  data,
}: {
  cam: MotionValue<number>;
  start: number;
  center: number;
  data: Interlude;
}) {
  const at = (v: number): Ymd => {
    const span = center - start;
    const t = span > 0 ? easeOutQuart(clamp((v - start) / span, 0, 1)) : 1;
    const d = new Date(data.from.getTime() + (data.to.getTime() - data.from.getTime()) * t);
    return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
  };

  const [date, setDate] = useState(() => at(cam.get()));
  const [landed, setLanded] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const monthKey = useRef(date.year * 12 + date.month);
  const sheetId = useRef(0);

  useMotionValueEvent(cam, "change", (v) => {
    const next = at(v);
    setDate((prev) =>
      prev.day === next.day && prev.month === next.month && prev.year === next.year ? prev : next,
    );

    const key = next.year * 12 + next.month;
    if (key !== monthKey.current) {
      const forward = key > monthKey.current;
      const torn = MONTHS[((monthKey.current % 12) + 12) % 12];
      monthKey.current = key;
      const id = ++sheetId.current;
      const sheet: Sheet = {
        id,
        label: torn,
        dx: (forward ? -1 : 1) * (40 + Math.random() * 110),
        dy: -70 - Math.random() * 90,
        rot: (forward ? -1 : 1) * (20 + Math.random() * 60),
      };
      setSheets((s) => [...s.slice(-7), sheet]);
      window.setTimeout(() => setSheets((s) => s.filter((x) => x.id !== id)), 1000);
    }

    setLanded(Math.abs(v - center) < 4);
  });

  const year = String(date.year);
  const rule = <span aria-hidden className="h-12 w-px bg-gold-soft sm:h-14" />;

  return (
    <div className="flex flex-col items-center gap-5">
      <Eyebrow className="tracking-[0.35em]">Kemudian…</Eyebrow>

      <div className="relative">
        {/* torn-off month cards */}
        {sheets.map((sh) => (
          <motion.div
            key={sh.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: sh.dx, y: sh.dy, opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.95, ease: [0.2, 0.7, 0.4, 1] }}
            className="pointer-events-none absolute left-1/2 top-1 z-0 -ml-9 grid h-12 w-[4.5rem] place-items-center rounded-[3px] border border-line bg-paper font-serif text-lg tracking-[0.18em] text-muted"
          >
            {sh.label}
          </motion.div>
        ))}

        <motion.div
          animate={landed ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative z-10"
        >
          <DoubleFrame className="shadow-paint-md" innerClassName="flex items-center gap-3 px-5 py-3 sm:gap-5 sm:px-7">
            <span className="flex">
              {pad(date.day).split("").map((ch, i) => (
                <FlapTile key={i} value={ch} />
              ))}
            </span>
            {rule}
            <FlapTile value={MONTHS[date.month]} wide />
            {rule}
            <span className="flex">
              {year.split("").map((ch, i) => (
                <FlapTile key={i} value={ch} />
              ))}
            </span>
          </DoubleFrame>
        </motion.div>
      </div>

      {/* once the date lands, a gold ornament draws out under it and the line below it appears */}
      <motion.div
        animate={landed ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.4 }}
        transition={{ duration: 0.7, delay: landed ? 0.2 : 0, ease: [0.22, 1, 0.36, 1] }}
        className="w-48"
      >
        <Ornament className="[&>span:first-child]:flex-1 [&>span:last-child]:flex-1" />
      </motion.div>

      <motion.p
        animate={landed ? { opacity: 1, y: 0 } : { opacity: 0.4, y: 6 }}
        transition={{ duration: 0.45, delay: landed ? 0.4 : 0 }}
        className="-mt-2 font-script text-3xl text-ink sm:text-4xl"
      >
        {data.label}
      </motion.p>
    </div>
  );
}

/* ------------------------------------------------------------------ intro */

export default function ComicIntro({
  settings,
  onFinish,
  onWake,
}: {
  settings: Settings;
  onFinish: () => void;
  /** the guest tapped to open their eyes: a user gesture, so sound may start */
  onWake?: () => void;
}) {
  const { scenes, interludes } = buildStory(settings);
  const last = scenes.length - 1;
  const reduce = useReducedMotion();

  const { w, h } = useViewport();
  const narrow = w < 640;
  // on a phone the panel takes nearly the full width, so the little games are big enough to play
  const panel = Math.round(Math.min(w * (narrow ? 0.92 : 0.78), h * (narrow ? 0.56 : 0.5), 460));
  // the search game gets an even larger stage: its picture is wide and full of faces
  const bigPanel = Math.round(Math.min(w * (narrow ? 0.97 : 0.78), h * (narrow ? 0.6 : 0.56), 540));
  // distance between panels: room for the flip counter and a glimpse of each panel
  const seg = w * 0.5 + panel + 260;

  const cam = useMotionValue(0);
  const trackX = useTransform(cam, (v) => -v);
  const pan = useRef<AnimationPlaybackControls | null>(null);
  const indexRef = useRef(0);
  // bumped whenever a new camera move starts, so an older multi-step move bails out
  const run = useRef(0);

  const [index, setIndex] = useState(0);
  const [arrived, setArrived] = useState(true);
  const [done, setDone] = useState<boolean[]>(() => scenes.map(() => false));
  const [nudge, setNudge] = useState(0);
  const [eyes, setEyes] = useState<"closed" | "opening" | "open">("closed");

  const go = useCallback(
    (target: number) => {
      const n = clamp(target, 0, last);
      const from = indexRef.current;
      const id = ++run.current;
      indexRef.current = n;
      setIndex(n);
      setArrived(false);
      pan.current?.stop();

      /** slide the camera; `perSeg` = seconds a full panel-to-panel move would take */
      const glide = (to: number, perSeg: number) => {
        const dist = Math.abs(cam.get() - to);
        pan.current = animate(cam, to, {
          duration: reduce ? 0.3 : clamp((dist / seg) * perSeg, 0.35, perSeg),
          ease: [0.65, 0, 0.35, 1],
        });
        return pan.current;
      };

      void (async () => {
        // one panel ahead: glide slowly to the calendar, let the date land, then carry on
        const mid = from * seg + seg / 2;
        if (n === from + 1 && !reduce && cam.get() <= mid + 2) {
          if (cam.get() < mid - 2) {
            await glide(mid, 5.2);
            if (id !== run.current) return;
          }
          await new Promise((r) => window.setTimeout(r, 1700));
          if (id !== run.current) return;
        }
        await glide(n * seg, 3.6);
        if (id === run.current) setArrived(true);
      })();
    },
    [cam, last, reduce, seg],
  );

  // keep the camera on the current panel when the viewport resizes
  useEffect(() => {
    if (!seg) return;
    run.current++;
    pan.current?.stop();
    pan.current = animate(cam, indexRef.current * seg, {
      duration: 0.01,
      onComplete: () => setArrived(true),
    });
  }, [cam, seg]);

  const tryNext = useCallback(() => {
    if (index >= last || !arrived) return;
    if (done[index]) go(index + 1);
    else setNudge((k) => k + 1);
  }, [arrived, done, go, index, last]);

  // like moving on: nothing else is taken until the camera has stopped
  const tryBack = useCallback(() => {
    if (index > 0 && arrived) go(index - 1);
  }, [arrived, go, index]);

  useEffect(() => {
    if (eyes !== "open") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") tryNext();
      if (e.key === "ArrowLeft" || e.key === "PageUp") tryBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [eyes, tryBack, tryNext]);

  /* ---- swipe: a flick moves exactly one panel; the strip never follows the finger ---- */
  const swipe = useRef<{ x0: number; y0: number } | null>(null);
  const wheelLock = useRef(0);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (eyes !== "open" || e.button > 0) return;
    swipe.current = { x0: e.clientX, y0: e.clientY };
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x0;
    const dy = e.clientY - s.y0;
    if (Math.abs(dx) < Math.min(w * 0.12, 90) || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) tryNext();
    else tryBack();
  };
  const onWheel = (e: ReactWheelEvent) => {
    if (eyes !== "open") return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 25 || Date.now() < wheelLock.current) return;
    wheelLock.current = Date.now() + 1300;
    if (delta > 0) tryNext();
    else tryBack();
  };

  const markDone = (i: number) => setDone((prev) => prev.map((v, j) => (j === i ? true : v)));
  const settled = arrived && eyes === "open";
  const canAdvance = settled && done[index] && index < last;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 overflow-clip bg-page"
      style={
        {
          "--panel": `${panel}px`,
          "--below": `calc(${panel}px * 0.17 + 8.5rem)`,
        } as CSSProperties
      }
    >
      <BotanicalFrame />

      {/* the comic strip — the camera slides along it; blurry until the eyes have opened */}
      <motion.div
        className="absolute inset-0 touch-none select-none"
        initial={false}
        animate={
          eyes === "closed" && !reduce
            ? { filter: "blur(14px)", scale: 1.08 }
            : // "none" once open: a lingering blur(0px) keeps the whole strip on a filter layer
              { filter: eyes === "open" ? "none" : "blur(0px)", scale: 1 }
        }
        // clears as the lids finish lifting
        transition={{ delay: 0.6, duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
        onWheel={onWheel}
      >
        {w > 0 && (
          <motion.div className="absolute inset-y-0 left-0 will-change-transform" style={{ x: trackX }}>
            {scenes.map((scene, i) =>
              // only the panel on screen and its neighbours exist: the rest of the strip is
              // off-camera, and nine live panels at once is what made phones stutter
              Math.abs(i - index) > 1 ? null : (
              <div
                key={scene.key}
                className="absolute inset-y-0 flex flex-col items-center justify-center"
                style={
                  {
                    left: i * seg,
                    width: w,
                    ...(scene.key === "gbk" ? { "--panel-h": "calc(var(--panel) * 1.12)" } : {}),
                    ...(scene.key === "findus"
                      ? {
                          "--panel": `${bigPanel}px`,
                          "--panel-h": `${Math.round(bigPanel * 0.8)}px`,
                          "--cap-pad": "176px",
                          "--below": "calc(176px + 7.5rem)",
                        }
                      : {}),
                  } as CSSProperties
                }
                inert={i !== index}
              >
                <ScenePanel
                  scene={scene}
                  settings={settings}
                  present={settled && i === index}
                  done={done[i]}
                  nudge={i === index ? nudge : 0}
                  onDone={() => {
                    markDone(i);
                    if (i === 0) go(1);
                  }}
                  onFinish={onFinish}
                />
              </div>
              ),
            )}
            {interludes.map((data, i) =>
              // the calendar between panel i and i+1 is only ever seen from those two
              i !== index && i !== index - 1 ? null : (
              <div
                key={i}
                className="pointer-events-none absolute inset-y-0 flex flex-col items-center justify-center"
                style={{ left: i * seg + seg / 2, width: w }}
                aria-hidden
              >
                <div className="flex items-center justify-center" style={{ height: "var(--panel)" }}>
                  <CalendarRoll cam={cam} start={i * seg + seg * 0.06} center={i * seg + seg / 2} data={data} />
                </div>
                <div style={{ height: "var(--below)" }} />
              </div>
              ),
            )}
          </motion.div>
        )}
      </motion.div>

      {/* chapter progress: thin segments, the reached ones in green */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[68px] z-30 flex -translate-x-1/2 gap-1 sm:top-7 sm:gap-1.5">
        {scenes.map((s, i) => (
          <motion.span
            key={s.key}
            className="h-0.5"
            animate={{
              width: i === index ? (narrow ? 28 : 40) : narrow ? 16 : 24,
              backgroundColor: i <= index ? colors.brand : colors.line,
            }}
          />
        ))}
      </div>

      <button
        onClick={onFinish}
        className="absolute right-3 top-3 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold bg-paper px-4 font-code text-[12px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-chrome sm:right-5 sm:px-5 sm:text-[13px] sm:tracking-[0.12em]"
      >
        Ke Undangan
        <svg aria-hidden width="16" height="10" viewBox="0 0 18 10" fill="none" strokeWidth="1.5" strokeLinecap="round" className="stroke-brand max-sm:hidden">
          <path d="M1 5h15M12 1l4 4-4 4" />
        </svg>
      </button>

      <AnimatePresence>
        {settled && index > 0 && (
          <motion.button
            key="back"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={tryBack}
            aria-label="Panel sebelumnya"
            className="absolute bottom-6 left-5 z-30 grid h-11 w-11 place-items-center rounded-full border border-line bg-paper text-ink/70 transition-colors hover:border-gold"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
        )}
        {canAdvance && (
          <motion.button
            key="next"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.9 }}
            onClick={() => go(index + 1)}
            aria-label="Panel selanjutnya"
            className="absolute bottom-6 right-5 z-30 grid h-[52px] w-[52px] place-items-center rounded-full border border-honey bg-brand text-on-brand shadow-paint-md sm:right-24"
          >
            <motion.span
              animate={{ x: [-2, 3, -2] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronRight className="h-6 w-6" strokeWidth={1.6} />
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* opening: the guest starts with their eyes shut */}
      {eyes !== "open" && (
        <WakeUp
          opening={eyes === "opening"}
          reduce={!!reduce}
          onWake={() => {
            setEyes("opening");
            onWake?.();
          }}
          onOpened={() => setEyes("open")}
        />
      )}
    </motion.div>
  );
}
