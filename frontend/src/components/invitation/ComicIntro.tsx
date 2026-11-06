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
import { ChevronLeft, Hand } from "lucide-react";
import { parseDate } from "@/lib/dates";
import type { Settings } from "@/lib/types";
import { Float } from "./CrayonDoodles";
import { AnswerArt, AnswerInset, useAnswer } from "./Answer";
import { Frame, Stage } from "./chapterKit";
import { ComifuroArt, ComifuroInset, useComifuro } from "./Comifuro";
import { ConfessArt, ConfessInset, useConfess } from "./Confess";
import { FindUsArt, FindUsInset, useFindUs } from "./FindUs";
import { Flower } from "./Flowers";
import { GbkArt, GbkInset, useGbk } from "./Gbk";
import { LunchArt, LunchInset, useLunch } from "./Lunch";
import { MovieArt, MovieInset, useMovie } from "./Movie";
import WakeUp from "./WakeUp";
import { BLUSH, NAVY, RED } from "./watercolor";
import {
  CoffeeCup,
  Envelope,
  Heart,
  HeartBurst,
  Squiggle,
  WashBackdrop,
} from "./WatercolorArt";

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
      tag: { title: "Sebuah Kisah", chapter: "// chapter 01" },
      caption: "Dari rekan kerja, menjadi teman cerita, hingga akhirnya bersama selamanya.",
    },
    {
      key: "findus",
      tag: { title: "Awal Pertemuan", chapter: "// chapter 02" },
      date: "2024-04-01",
      caption: `Semua berawal di Sucofindo. ${bride} bergabung lebih dahulu, hingga sebulan kemudian ${groom} menyusul. Saat itu, mereka hanyalah dua orang rekan kerja yang belum saling mengenal. Belum ada yang menyangka bahwa pertemuan sederhana ini akan menjadi awal dari sebuah cerita panjang.`,
    },
    {
      key: "lunch",
      tag: { title: "Makan Siang Pertama", chapter: "// chapter 03" },
      // the couple said "31 April"; April ends on the 30th
      date: "2024-04-30",
      caption: `Kala itu, ${groom} masih malu-malu dan hampir tidak pernah makan siang bersama teman-teman kantor. Melihat hal itu, ${bride} akhirnya mengajak ${groom} makan siang bersama, karena kasihan melihatnya hanya duduk saat istirahat. Dari ajakan sederhana tersebut, mereka pun mulai mengobrol dan mengenal satu sama lain.`,
    },
    {
      key: "gbk",
      tag: { title: "Semakin Dekat", chapter: "// chapter 04" },
      caption: `${bride} kemudian mengajak ${groom} berolahraga bersama teman-teman kantor di GBK. Dari kegiatan bersama itu, kedekatan mereka mulai tumbuh. Di momen inilah ${groom} mulai mengikuti Instagram ${bride}, menjadi salah satu langkah kecil dalam perjalanan mereka untuk saling mengenal lebih jauh.`,
      date: "2024-05-10",
    },
    {
      key: "comifuro",
      tag: { title: "Hobi yang Sama", chapter: "// chapter 05" },
      caption: `Ternyata, mereka memiliki hobi yang sama, yaitu menyukai dunia anime. ${bride} pun mengajak ${groom} dan teman-teman lainnya untuk datang ke festival anime, Comifuro. Hari itu menjadi momen yang berkesan karena untuk pertama kalinya mereka banyak mengobrol dan pulang bersama naik kereta. Sebuah perjalanan pulang yang sederhana, tetapi menjadi bagian manis dari kisah mereka.`,
      date: "2024-05-11",
    },
    {
      key: "movie",
      tag: { title: "Nonton Berdua", chapter: "// chapter 06" },
      caption: `Setelah semakin sering mengobrol, bertukar pesan, dan menghabiskan waktu bersama, ${groom} akhirnya memberanikan diri mengajak ${bride} pergi berdua. Film Look Back menjadi pilihan mereka untuk menghabiskan waktu bersama. Dari sana, hubungan yang awalnya hanya sebatas rekan kerja perlahan berkembang menjadi sesuatu yang lebih istimewa.`,
      date: "2024-08-10",
    },
    {
      key: "confess",
      tag: { title: "Sebuah Pengakuan", chapter: "// chapter 07" },
      caption: `Di dalam TransJakarta, ${groom} akhirnya mengumpulkan keberanian untuk mengungkapkan perasaannya kepada ${bride}. Berbekal cokelat SilverQueen dan keberanian yang sudah dikumpulkan, ${groom} menyatakan isi hatinya—lalu langsung kabur karena gugup! Momen yang sederhana sekaligus menggemaskan ini menjadi salah satu kenangan yang tak terlupakan.`,
      date: "2024-08-10",
    },
    {
      key: "answer",
      tag: { title: "Sebuah Jawaban", chapter: "// chapter 08" },
      caption: `Setelah percakapan panjang, ${bride} akhirnya menerima perasaan ${groom}. Tanggal 31 Agustus 2024, di Pesta Buku Taman Ismail Marzuki, menjadi awal resmi perjalanan mereka sebagai pasangan. Sejak hari itu, mereka mulai menulis cerita bersama, melewati suka dan duka, serta belajar untuk terus tumbuh berdampingan.`,
      date: "2024-08-31",
      accent: true,
    },
    {
      key: "wedding",
      tag: { title: "Forever Begins", chapter: "// chapter 09" },
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
      className={`px-6 text-center font-script leading-snug text-[#2F3D35]/90 ${
        text.length > 360
          ? "max-w-xl text-sm leading-tight sm:text-lg"
          : text.length > 160
            ? "max-w-md text-base leading-tight sm:text-xl"
            : "max-w-sm text-xl sm:text-2xl"
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

/** the small pop-over panel; `progress` draws Florence's pill bar above it */
function InsetCard({ children, progress }: { children: ReactNode; progress?: number }) {
  return (
    <div className="relative h-full w-full">
      {progress !== undefined && (
        <div className="crayon-pill absolute -top-6 left-[8%] right-[8%] h-3.5 overflow-hidden rounded-full bg-[#FCFDF9]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: RED, originX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      )}
      <div
        className="wc crayon-box relative h-full w-full overflow-hidden rounded-[12px] bg-[#FCFDF9]"
        style={{ boxShadow: "4px 5px 0 0 #BFD2B5" }}
      >
        {children}
      </div>
    </div>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <span className="font-eyebrow pointer-events-none text-[9px] text-[#2F3D35]/60 sm:text-[10px]">{children}</span>
  );
}

/** cover: tap the heart three times to fill it with paint */
function HeartInset({ done, onDone }: InsetProps) {
  const need = 3;
  const [taps, setTaps] = useState(0);
  const fill = done ? 1 : taps / need;

  const tap = () => {
    if (done) return;
    const n = taps + 1;
    setTaps(n);
    if (n >= need) onDone();
  };

  return (
    <InsetCard>
      <button
        type="button"
        onClick={tap}
        aria-label="Ketuk hatinya"
        className="flex h-full w-full items-center justify-center gap-4"
      >
        <motion.div
          key={taps}
          initial={{ scale: taps ? 1.3 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 10 }}
          className="relative aspect-[48/46] h-[66%]"
        >
          <Heart animate={false} className="absolute inset-0 h-full w-full text-[#2F3D35]" />
          <div
            className="absolute inset-0 transition-[clip-path] duration-500"
            style={{ clipPath: `inset(${(1 - fill) * 100}% 0 0 0)` }}
          >
            <Heart animate={false} color={BLUSH} className="h-full w-full text-[#2F3D35]" />
          </div>
        </motion.div>
        <div className="flex flex-col items-start gap-1">
          <span className="font-poster text-base text-[#2F3D35] sm:text-lg">{done ? "penuh!" : `${need - taps}×`}</span>
          <Hint>{done ? "hatinya terisi" : "ketuk hatinya"}</Hint>
        </div>
      </button>
    </InsetCard>
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
        <motion.div
          animate={done ? { y: -8, scale: 1.12, rotate: [0, -6, 6, 0] } : { y: [0, -3, 0] }}
          transition={done ? { duration: 0.6 } : { duration: 1.6, repeat: Infinity }}
          className="h-[70%]"
        >
          <Envelope animate={false} className="h-full w-auto text-[#2F3D35]" />
        </motion.div>
        <div className="flex flex-col items-start gap-1">
          <span className="font-poster text-base text-[#2F3D35] sm:text-lg">Buka Amplop</span>
          <Hint>{done ? "membuka…" : "ketuk untuk membuka"}</Hint>
        </div>
        {done && <HeartBurst className="absolute -top-10 left-1/2 h-14 w-auto -translate-x-1/2 text-[#2F3D35]" />}
      </button>
    </InsetCard>
  );
}

/* ----------------------------------------------------------------- panels */

function CoverArt({ groom, bride }: { groom: string; bride: string }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-6 pb-[16%] text-center">
      <WashBackdrop />
      <Float className="absolute left-[12%] top-[14%]" dur={5}>
        <Heart color={BLUSH} className="h-7 w-auto text-[#2F3D35]" />
      </Float>
      <Float className="absolute right-[12%] top-[18%]" dur={4.4} delay={0.6}>
        <CoffeeCup className="h-8 w-auto text-[#2F3D35]/70" />
      </Float>
      <p className="font-eyebrow relative text-[10px] text-[#2F3D35]/60 sm:text-xs">{"// sebuah kisah"}</p>
      <h1 className="relative mt-2 font-script text-4xl font-bold leading-tight text-[#2F3D35] sm:text-5xl">
        Our Love Story
      </h1>
      <div className="relative mt-1 text-[#C2676A]">
        <Squiggle className="w-28 sm:w-36" delay={0.4} />
      </div>
      <p className="relative mt-2 font-poster text-lg text-[#3F6B57] sm:text-xl">
        {groom} &amp; {bride}
      </p>
    </div>
  );
}

/** the last panel: the wedding drawing, with baby's breath tucked into the corners */
function WeddingArt() {
  return (
    <Stage>
      <Frame src="/images/illustrations/wedding.jpg" position="50% 40%" />
      <Flower kind="sprig" className="absolute -left-4 -top-6 w-24 rotate-[160deg] sm:w-32" />
      <Flower kind="sprig" className="absolute -bottom-6 -right-4 w-24 -rotate-[20deg] sm:w-32" />
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
          <div className="relative" style={{ width: "var(--panel)", height: "var(--panel)" }}>
            <div
              className="wc crayon-box relative h-full w-full overflow-hidden rounded-[14px] bg-[#FCFDF9]"
              style={{ boxShadow: "6px 7px 0 0 #C3D0AE" }}
            >
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

            {scene.accent && (
              <Float className="absolute -right-4 -top-6 z-10" dur={4} dist={8}>
                <Heart color={BLUSH} className="h-9 w-auto text-[#2F3D35]" />
              </Float>
            )}

            {/* Florence-style name tag over the panel */}
            <motion.div
              initial={false}
              animate={present ? { opacity: 1, x: 0, rotate: -2 } : { opacity: 0, x: -14, rotate: -6 }}
              transition={{ delay: present ? 0.15 : 0, type: "spring", stiffness: 240, damping: 20 }}
              className="wc crayon-box absolute -left-3 top-[7%] z-10 rounded-[8px] bg-[#FCFDF9] px-3 py-1.5 text-center"
            >
              <p className="font-poster text-sm leading-tight text-[#2F3D35] sm:text-base">{scene.tag.title}</p>
              <p className="font-eyebrow text-[9px] text-[#2F3D35]/55 sm:text-[10px]">{scene.tag.chapter}</p>
            </motion.div>

            {/* the interactive inset hangs off the bottom edge */}
            <div ref={scope} className="absolute inset-x-0 top-[80%] z-20 flex justify-center">
              <AnimatePresence>
                {present && (
                  <motion.div
                    initial={{ opacity: 0, y: 26, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 20 }}
                    className="relative"
                    style={{ width: "calc(var(--panel) * 0.74)", height: "calc(var(--panel) * 0.34)" }}
                  >
                    {inset}
                    {!done && (
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute -bottom-3 -right-3 text-[#2F3D35]"
                        animate={{ scale: [1, 0.82, 1], rotate: [-8, -14, -8] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: 1.2 }}
                      >
                        <Hand className="h-6 w-6 fill-[#FCFDF9]" />
                      </motion.span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div
            className="flex items-start justify-center"
            style={{ height: "var(--below)", paddingTop: "calc(var(--panel) * 0.17 + 14px)" }}
          >
            {(done || scene.captionFirst) && present && <StoryCaption text={scene.caption} />}
          </div>
        </>
      )}
    </Chapter>
  );
}

/* --------------------------------------------------------- calendar roll */

/** one split-flap tile: each new value flips down over the old one */
function FlapTile({ value, wide = false }: { value: string; wide?: boolean }) {
  // a fresh key per flip: reusing the value as key gets stuck blank when a
  // digit flips away and straight back while its old copy is still exiting
  const [flip, setFlip] = useState({ value, n: 0 });
  if (flip.value !== value) setFlip({ value, n: flip.n + 1 });

  return (
    <span
      className={`relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#3F6B57] font-poster text-[#F6FAF2] [perspective:220px] sm:h-14 ${
        wide ? "w-[4.1rem] text-2xl sm:w-[5rem] sm:text-3xl" : "w-8 text-3xl sm:w-10 sm:text-4xl"
      }`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={flip.n}
          initial={{ rotateX: -85, y: "-28%", opacity: 0.45 }}
          animate={{ rotateX: 0, y: 0, opacity: 1 }}
          exit={{ rotateX: 85, y: "28%", opacity: 0, transition: { duration: 0.12 } }}
          transition={{ type: "spring", stiffness: 480, damping: 20 }}
          className="block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/[0.06]" />
      <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[#2A4A3C]" />
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

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* torn-off month pages */}
        {sheets.map((sh) => (
          <motion.div
            key={sh.id}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
            animate={{ x: sh.dx, y: sh.dy, rotate: sh.rot, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.95, ease: [0.2, 0.7, 0.4, 1] }}
            className="wc crayon-box pointer-events-none absolute left-1/2 top-1 z-0 -ml-9 grid h-12 w-[4.5rem] place-items-center rounded-[6px] bg-[#FCFDF9] font-poster text-lg text-[#2F3D35]/70"
          >
            {sh.label}
          </motion.div>
        ))}

        {/* binding rings */}
        <div className="absolute -top-3 left-0 right-0 z-20 flex justify-between px-10">
          {[0, 1].map((r) => (
            <span key={r} className="h-6 w-3 rounded-full border-2 border-[#2F3D35] bg-[#F2F6EF]" />
          ))}
        </div>

        <motion.div
          animate={landed ? { scale: [1, 1.07, 1], rotate: [0, -1.5, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="wc crayon-box relative z-10 flex items-center gap-2.5 rounded-[12px] bg-[#FCFDF9] px-3.5 pb-3 pt-4 sm:gap-3"
          style={{ boxShadow: "5px 6px 0 0 #AACAB4" }}
        >
          <span className="flex gap-1">
            {pad(date.day).split("").map((ch, i) => (
              <FlapTile key={i} value={ch} />
            ))}
          </span>
          <FlapTile value={MONTHS[date.month]} wide />
          <span className="flex gap-1">
            {year.split("").map((ch, i) => (
              <FlapTile key={i} value={ch} />
            ))}
          </span>
        </motion.div>

        {/* red crayon circle + heart once the date lands */}
        <div className="pointer-events-none absolute -bottom-5 -left-6 -right-6 -top-6 z-20">
          <svg viewBox="0 0 320 120" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
            <motion.path
              d="M150 8 C230 6 312 22 310 60 C308 100 220 114 152 112 C80 110 10 98 10 60 C10 24 84 8 170 14"
              fill="none"
              stroke={RED}
              strokeWidth="3.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter="url(#wc-crayon)"
              initial={false}
              animate={{ pathLength: landed ? 1 : 0, opacity: landed ? 1 : 0 }}
              transition={{ duration: landed ? 0.75 : 0.2, delay: landed ? 0.15 : 0, ease: "easeInOut" }}
            />
          </svg>
        </div>
        <AnimatePresence>
          {landed && (
            <motion.div
              key="heart"
              className="absolute -right-8 -top-9 z-30"
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 12 }}
              exit={{ scale: 0, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 380, damping: 11, delay: 0.7 }}
            >
              <Heart color={BLUSH} animate={false} className="h-10 w-auto text-[#2F3D35]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.p
        animate={landed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.45, y: 6, scale: 0.96 }}
        transition={{ duration: 0.45, delay: landed ? 0.5 : 0 }}
        className="mt-1 font-script text-2xl text-[#2F3D35] sm:text-3xl"
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
  const panel = Math.round(Math.min(w * 0.78, h * 0.5, 460));
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
      className="fixed inset-0 z-50 overflow-clip bg-[#F2F6EF]"
      style={
        {
          "--panel": `${panel}px`,
          "--below": `calc(${panel}px * 0.17 + 8.5rem)`,
        } as CSSProperties
      }
    >
      <WashBackdrop />

      {/* the comic strip — the camera slides along it; blurry until the eyes have opened */}
      <motion.div
        className="absolute inset-0 touch-none select-none"
        initial={false}
        animate={
          eyes === "closed" && !reduce ? { filter: "blur(14px)", scale: 1.08 } : { filter: "blur(0px)", scale: 1 }
        }
        // clears as the lids finish lifting
        transition={{ delay: 0.6, duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
        onWheel={onWheel}
      >
        {w > 0 && (
          <motion.div className="absolute inset-y-0 left-0" style={{ x: trackX }}>
            {scenes.map((scene, i) => (
              <div
                key={scene.key}
                className="absolute inset-y-0 flex flex-col items-center justify-center"
                style={{ left: i * seg, width: w }}
                inert={i !== index}
              >
                <ScenePanel
                  scene={scene}
                  settings={settings}
                  present={settled && i === index}
                  done={done[i]}
                  nudge={i === index ? nudge : 0}
                  onDone={() => markDone(i)}
                  onFinish={onFinish}
                />
              </div>
            ))}
            {interludes.map((data, i) => (
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
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* chapter dots */}
      <div className="pointer-events-none absolute left-1/2 top-6 z-30 flex -translate-x-1/2 gap-2">
        {scenes.map((s, i) => (
          <motion.span
            key={s.key}
            className="h-2 rounded-full"
            animate={{
              width: i === index ? 22 : 8,
              backgroundColor: i <= index ? NAVY : "rgba(47,61,53,0.18)",
            }}
          />
        ))}
      </div>

      <button
        onClick={onFinish}
        className="wc crayon-pill absolute right-5 top-4 z-30 rounded-full bg-[#FCFDF9] px-4 py-1.5 font-code text-xs text-[#2F3D35]/80 transition-transform hover:-translate-y-0.5"
      >
        Lewati
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
            className="wc crayon-pill absolute bottom-6 left-5 z-30 grid h-10 w-10 place-items-center rounded-full bg-[#FCFDF9] text-[#2F3D35]/70"
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
            className="wc crayon-pill absolute bottom-6 right-5 z-30 flex items-center gap-2 rounded-full bg-[#FCFDF9] px-4 py-2 font-code text-xs text-[#2F3D35]"
          >
            <motion.span
              animate={{ x: [8, -8, 8] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Hand className="h-4 w-4" />
            </motion.span>
            geser
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
