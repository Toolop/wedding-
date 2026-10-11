"use client";

import confetti from "canvas-confetti";
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
import type { Settings, StoryEvent } from "@/lib/types";
import { Float } from "./CrayonDoodles";
import { BLUSH, HONEY, INK, NAVY, PAPER, RED, TEAL, type IllustrationKey } from "./watercolor";
import {
  CoffeeCup,
  Envelope,
  Heart,
  HeartBurst,
  Illustration,
  Squiggle,
  Trophy,
  WashBackdrop,
} from "./WatercolorArt";

/*
 * A "Florence"-style interactive comic: one framed panel at a time, a small
 * inset panel pops over its bottom edge with a tiny thing to do (tap, scrub,
 * hold), and finishing it lets you swipe the camera sideways to the next
 * panel — past a flip counter that ticks as the strip slides by.
 */

type InsetKind = "heart" | "chat" | "camera" | "plate" | "trophy" | "envelope";

type Scene = {
  key: string;
  tag: { title: string; chapter: string };
  caption: string;
  /** show the caption before the inset is finished (the last panel) */
  captionFirst?: boolean;
  art: { kind: "cover" } | { kind: "collage" } | { kind: "image"; image: IllustrationKey };
  accent?: "heart" | "cup" | "trophy";
  inset: InsetKind;
};

/** a calendar between two panels that rolls from one story date to the next */
type Interlude = { from: Date; to: Date; label: string };
type Milestone = { date: Date; label: string };

const pad = (n: number, len = 2) => String(Math.max(0, n)).padStart(len, "0");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function parseDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const DAY = 86_400_000;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
const MONTH_WORDS: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, agt: 7, agustus: 7, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oktober: 9, oct: 9, october: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, dec: 11, december: 11,
};

/** story dates are free text in the admin: "Januari 2020", "14 Feb 2021", "2022-06-01", "2019" */
function parseLooseDate(value: string): Date | null {
  const v = value.trim().toLowerCase();
  if (/^\d{4}-\d{2}/.test(v)) return parseDate(v);
  const m = v.match(/(?:(\d{1,2})\s+)?([a-z]+)\.?\s+(\d{4})/);
  if (m && Object.hasOwn(MONTH_WORDS, m[2])) {
    return new Date(Number(m[3]), MONTH_WORDS[m[2]], m[1] ? Number(m[1]) : 1);
  }
  const y = v.match(/\b(\d{4})\b/);
  return y ? new Date(Number(y[1]), 0, 1) : null;
}

/**
 * One date per panel after the cover: the couple's story moments in order,
 * ending on the wedding day. Missing slots are filled halfway across the
 * longest gaps, so every real story date is always kept.
 */
function buildMilestones(story: StoryEvent[], weddingValue: string, count: number): Milestone[] {
  const wedding = parseDate(weddingValue);
  const points: Milestone[] = story
    .flatMap((s) => {
      const date = parseLooseDate(s.event_date);
      return date ? [{ date, label: s.title }] : [];
    })
    // the wedding itself is often also a story entry — the real date wins
    .filter((p) => !wedding || p.date.getTime() < wedding.getTime() - 31 * DAY)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (wedding) points.push({ date: wedding, label: "Hari Bahagia" });
  if (!points.length) points.push({ date: new Date(), label: "Hari Bahagia" });
  if (points.length === 1) {
    const d = points[0].date;
    points.unshift({ date: new Date(d.getFullYear() - 3, d.getMonth(), 1), label: "" });
  }

  while (points.length < count) {
    let gap = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].date.getTime() - points[i - 1].date.getTime() >
        points[gap + 1].date.getTime() - points[gap].date.getTime()) gap = i - 1;
    }
    const mid = new Date((points[gap].date.getTime() + points[gap + 1].date.getTime()) / 2);
    points.splice(gap + 1, 0, { date: new Date(mid.getFullYear(), mid.getMonth(), 1), label: "" });
  }

  // more story moments than panels: spread the picks, always ending on the last
  return Array.from({ length: count }, (_, k) => points[Math.round((k / (count - 1)) * (points.length - 1))]);
}

function buildStory(settings: Settings, story: StoryEvent[]): { scenes: Scene[]; interludes: Interlude[] } {
  const groom = settings.groom_name || "Dia";
  const bride = settings.bride_name || "Dia";

  const scenes: Scene[] = [
    {
      key: "cover",
      tag: { title: "Sebuah Kisah", chapter: "// chapter 01" },
      caption: "Ini kisah tentang dua orang yang suka kode, kopi, dan — ternyata — satu sama lain.",
      art: { kind: "cover" },
      inset: "heart",
    },
    {
      key: "cafe",
      tag: { title: `${groom} & ${bride}`, chapter: "// chapter 02" },
      caption:
        "Awalnya cuma dua orang di satu meja — segelas air, secangkir kopi, dan obrolan tentang kode yang tak kunjung selesai.",
      art: { kind: "image", image: "cafe" },
      accent: "cup",
      inset: "chat",
    },
    {
      key: "hello",
      tag: { title: "Galeri Berdua", chapter: "// chapter 03" },
      caption: `Lama-lama, ${groom} dan ${bride} jadi langganan muncul di galeri foto satu sama lain — selalu dengan pose yang sama.`,
      art: { kind: "image", image: "hello" },
      accent: "heart",
      inset: "camera",
    },
    {
      key: "dinner",
      tag: { title: "Makan Malam", chapter: "// chapter 04" },
      caption:
        "Makan malam sederhana jadi tempat favorit: bersandar, tertawa, dan diam-diam merencanakan masa depan.",
      art: { kind: "image", image: "dinner" },
      accent: "heart",
      inset: "plate",
    },
    {
      key: "champions",
      tag: { title: "Juara Satu", chapter: "// chapter 05" },
      caption: "Setiap kemenangan kecil terasa seperti juara satu — asal dirayakan berdua.",
      art: { kind: "image", image: "champions" },
      accent: "trophy",
      inset: "trophy",
    },
    {
      key: "final",
      tag: { title: "Versi Terbaru", chapter: "// chapter 06" },
      caption: "Sampai tiba waktunya untuk merilis versi terbaru dari kisah mereka —",
      captionFirst: true,
      art: { kind: "collage" },
      inset: "envelope",
    },
  ];

  // panel k (k ≥ 1) sits on milestone k-1; the first calendar rolls in from a year earlier
  const milestones = buildMilestones(story, settings.wedding_date, scenes.length - 1);
  const first = milestones[0].date;
  const interludes: Interlude[] = milestones.map((m, i) => ({
    from: i === 0 ? new Date(first.getFullYear() - 1, first.getMonth(), 1) : milestones[i - 1].date,
    to: m.date,
    label: m.label || scenes[i + 1].tag.title,
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
      transition={{ staggerChildren: 0.04, delayChildren: 0.25 }}
      className="max-w-sm px-6 text-center font-script text-xl leading-snug text-[#2B2522]/90 sm:text-2xl"
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
        <div className="crayon-pill absolute -top-6 left-[8%] right-[8%] h-3.5 overflow-hidden rounded-full bg-[#FFFDF8]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: RED, originX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      )}
      <div
        className="wc crayon-box relative h-full w-full overflow-hidden rounded-[12px] bg-[#FFFDF8]"
        style={{ boxShadow: "4px 5px 0 0 #E0CBA9" }}
      >
        {children}
      </div>
    </div>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <span className="font-eyebrow pointer-events-none text-[9px] text-[#2B2522]/60 sm:text-[10px]">{children}</span>
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
          <Heart animate={false} className="absolute inset-0 h-full w-full text-[#2B2522]" />
          <div
            className="absolute inset-0 transition-[clip-path] duration-500"
            style={{ clipPath: `inset(${(1 - fill) * 100}% 0 0 0)` }}
          >
            <Heart animate={false} color={BLUSH} className="h-full w-full text-[#2B2522]" />
          </div>
        </motion.div>
        <div className="flex flex-col items-start gap-1">
          <span className="font-poster text-base text-[#2B2522] sm:text-lg">{done ? "penuh!" : `${need - taps}×`}</span>
          <Hint>{done ? "hatinya terisi" : "ketuk hatinya"}</Hint>
        </div>
      </button>
    </InsetCard>
  );
}

/** café: tap to send the next chat bubble */
function ChatInset({ done, onDone, groom, bride }: InsetProps & { groom: string; bride: string }) {
  const msgs = [
    { me: false, text: "ngopi lagi besok? ☕" },
    { me: true, text: "boleh, asal kamu yang traktir 😄" },
    { me: false, text: "deal. tiap hari juga boleh." },
  ];
  const [sent, setSent] = useState(0);
  const count = done ? msgs.length : sent;
  const next = msgs[count];

  const tap = () => {
    if (done) return;
    const n = sent + 1;
    setSent(n);
    if (n >= msgs.length) onDone();
  };

  return (
    <InsetCard>
      <button
        type="button"
        onClick={tap}
        aria-label="Ketuk untuk membalas pesan"
        className="flex h-full w-full flex-col justify-end gap-1 p-2 text-left"
      >
        <AnimatePresence initial={false}>
          {msgs.slice(0, count).map((m, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`max-w-[85%] rounded-2xl px-2.5 py-1 text-[10px] font-semibold leading-tight text-[#2B2522] sm:text-xs ${
                m.me ? "self-end rounded-br-sm bg-[#F7D9D2]" : "self-start rounded-bl-sm bg-[#DCE5F2]"
              }`}
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {next ? (
          <motion.div
            layout
            className={`flex items-center gap-1.5 ${next.me ? "self-end" : "self-start"}`}
          >
            <span className="flex gap-0.5 rounded-full bg-[#F6EAD6] px-2 py-1.5">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="h-1 w-1 rounded-full bg-[#2B2522]/60"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                />
              ))}
            </span>
            <Hint>{next.me ? bride : groom} mengetik…</Hint>
          </motion.div>
        ) : (
          <Hint>✓✓ dibaca</Hint>
        )}
      </button>
    </InsetCard>
  );
}

/** galeri: snap three photos — the main panel flashes white each time */
function CameraInset({ done, onDone, onFlash }: InsetProps) {
  const need = 3;
  const [shots, setShots] = useState(0);
  const taken = done ? need : shots;

  const shoot = () => {
    if (done) return;
    onFlash();
    const n = shots + 1;
    setShots(n);
    if (n >= need) onDone();
  };

  return (
    <InsetCard>
      <div className="flex h-full w-full items-center justify-between gap-2 px-3">
        <div className="flex h-[70%] flex-1 items-center justify-center gap-1.5">
          {Array.from({ length: need }, (_, i) => (
            <div
              key={i}
              className="relative aspect-[4/5] h-full rounded-sm border border-dashed border-[#2B2522]/30"
            >
              <AnimatePresence>
                {i < taken && (
                  <motion.div
                    initial={{ opacity: 0, y: -24, rotate: -14, scale: 1.3 }}
                    animate={{ opacity: 1, y: 0, rotate: [-6, 5, -3][i], scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 14 }}
                    className="absolute inset-0 bg-white p-[8%] pb-[22%] shadow-[1px_2px_0_0_#E0CBA9]"
                  >
                    <Illustration name="hello" className="h-full w-full object-cover" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-1">
          <motion.button
            type="button"
            onClick={shoot}
            whileTap={{ scale: 0.85 }}
            aria-label="Ambil foto"
            className="crayon-pill grid h-11 w-11 place-items-center rounded-full bg-[#FFFDF8] sm:h-14 sm:w-14"
          >
            <span className="h-7 w-7 rounded-full sm:h-9 sm:w-9" style={{ background: RED }} />
          </motion.button>
          <Hint>{done ? "cekrek!" : `${taken}/${need}`}</Hint>
        </div>
      </div>
    </InsetCard>
  );
}

const BITES = [
  { d: "M44 52 C40 44 58 38 66 44 C72 50 64 60 54 60 C48 60 46 56 44 52 Z", color: "#C98A4B", at: 0.18 },
  { d: "M66 58 C64 50 82 46 88 52 C92 58 84 66 76 66 C70 66 67 62 66 58 Z", color: "#B97A3F", at: 0.4 },
  { d: "M104 46 C106 36 136 36 142 46 C148 56 134 66 120 64 C108 62 102 56 104 46 Z", color: HONEY, at: 0.62 },
  { d: "M120 64 C126 60 150 60 152 66 C154 72 136 76 126 74 C120 72 117 68 120 64 Z", color: "#F5DDA0", at: 0.84 },
];

/** dinner: scrub the spoon back and forth to finish the plate */
function PlateInset({ done, onDone }: InsetProps) {
  const [eaten, setEaten] = useState(0);
  const prog = useRef(0);
  const last = useRef<number | null>(null);
  const travel = useRef(0);
  const area = useRef<HTMLDivElement>(null);
  const spoonX = useMotionValue(0);
  const spoonTilt = useTransform(spoonX, [-80, 80], [-18, 18]);
  const p = done ? 1 : eaten;

  const add = (amount: number) => {
    if (done || prog.current >= 1) return;
    prog.current = Math.min(1, prog.current + amount);
    setEaten(prog.current);
    if (prog.current >= 1) onDone();
  };

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = e.clientX;
    travel.current = 0;
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (last.current === null) return;
    e.stopPropagation();
    const dx = e.clientX - last.current;
    last.current = e.clientX;
    travel.current += Math.abs(dx);
    const width = area.current?.offsetWidth ?? 200;
    spoonX.set(clamp(spoonX.get() + dx, -width * 0.32, width * 0.32));
    add(Math.abs(dx) / (width * 4));
  };
  const up = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (last.current !== null && travel.current < 6) add(0.08); // plain taps nibble too
    last.current = null;
  };

  return (
    <InsetCard progress={p}>
      <div
        ref={area}
        role="button"
        tabIndex={0}
        aria-label="Geser sendok untuk makan"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            add(0.12);
          }
        }}
        className="relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
      >
        <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <g filter="url(#wc-paint)">
            <ellipse cx="100" cy="56" rx="86" ry="34" fill={PAPER} transform="translate(1.2 1.4)" />
            {BITES.map((b) => (
              <motion.path
                key={b.d}
                d={b.d}
                fill={b.color}
                style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}
                animate={p >= b.at ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              />
            ))}
          </g>
          <g filter="url(#wc-crayon)" fill="none" stroke={INK} strokeLinecap="round">
            <ellipse cx="100" cy="56" rx="86" ry="34" strokeWidth="2.4" strokeDasharray="10 2.5 16 3" />
            <ellipse cx="100" cy="54" rx="62" ry="22" strokeWidth="1.4" opacity="0.5" />
          </g>
        </svg>
        <motion.svg
          viewBox="0 0 40 90"
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[6%] h-[80%] w-auto -translate-x-1/2"
          style={{ x: spoonX, rotate: spoonTilt }}
        >
          <g filter="url(#wc-crayon)" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M20 4 C30 4 32 22 20 26 C8 22 10 4 20 4 Z" fill="#D9DEE6" />
            <path d="M20 26 V86" />
          </g>
        </motion.svg>
        <span className="absolute bottom-1 left-0 right-0 text-center">
          <Hint>{done ? "habis! 😋" : "geser sendoknya ↔"}</Hint>
        </span>
      </div>
    </InsetCard>
  );
}

/** champions: press and hold to hoist the trophy */
function TrophyInset({ done, onDone }: InsetProps) {
  const [lift, setLift] = useState(0);
  const prog = useRef(0);
  const holding = useRef(false);
  const doneRef = useRef(done);
  const onDoneRef = useRef(onDone);
  const btn = useRef<HTMLButtonElement>(null);
  const [holdingUi, setHoldingUi] = useState(false);

  useEffect(() => {
    doneRef.current = done;
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    let id = 0;
    let t0 = performance.now();
    const tick = (t: number) => {
      const dt = (t - t0) / 1000;
      t0 = t;
      if (!doneRef.current) {
        const cur = prog.current;
        const nxt = clamp(holding.current ? cur + dt / 1.3 : cur - dt * 1.4, 0, 1);
        if (nxt !== cur) {
          prog.current = nxt;
          setLift(nxt);
          if (nxt >= 1) {
            doneRef.current = true;
            onDoneRef.current();
            const r = btn.current?.getBoundingClientRect();
            confetti({
              particleCount: 110,
              spread: 75,
              startVelocity: 38,
              origin: r
                ? { x: (r.left + r.width / 2) / window.innerWidth, y: r.top / window.innerHeight }
                : { y: 0.6 },
              colors: [RED, HONEY, NAVY, BLUSH, TEAL],
              zIndex: 200,
            });
          }
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const hold = (on: boolean) => {
    holding.current = on;
    setHoldingUi(on);
  };
  const p = done ? 1 : lift;

  return (
    <InsetCard progress={p}>
      <button
        ref={btn}
        type="button"
        aria-label="Tahan untuk mengangkat piala"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          hold(true);
        }}
        onPointerUp={() => hold(false)}
        onPointerCancel={() => hold(false)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
            e.preventDefault();
            hold(true);
          }
        }}
        onKeyUp={() => hold(false)}
        onContextMenu={(e) => e.preventDefault()}
        className="flex h-full w-full touch-none select-none items-center justify-center gap-4 [-webkit-touch-callout:none]"
      >
        <motion.div
          style={{ y: -p * 14, scale: 1 + p * 0.15 }}
          animate={holdingUi && !done ? { rotate: [-3, 3, -3] } : { rotate: 0 }}
          transition={{ duration: 0.25, repeat: holdingUi && !done ? Infinity : 0 }}
          className="h-[78%]"
        >
          <Trophy animate={false} className="h-full w-auto text-[#2B2522]" />
        </motion.div>
        <div className="flex flex-col items-start gap-1">
          <span className="font-poster text-base text-[#2B2522] sm:text-lg">{done ? "JUARA!" : "#1"}</span>
          <Hint>{done ? "dirayakan berdua" : "tahan untuk angkat"}</Hint>
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
          <Envelope animate={false} className="h-full w-auto text-[#2B2522]" />
        </motion.div>
        <div className="flex flex-col items-start gap-1">
          <span className="font-poster text-base text-[#2B2522] sm:text-lg">Buka Amplop</span>
          <Hint>{done ? "membuka…" : "ketuk untuk membuka"}</Hint>
        </div>
        {done && <HeartBurst className="absolute -top-10 left-1/2 h-14 w-auto -translate-x-1/2 text-[#2B2522]" />}
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
        <Heart color={BLUSH} className="h-7 w-auto text-[#2B2522]" />
      </Float>
      <Float className="absolute right-[12%] top-[18%]" dur={4.4} delay={0.6}>
        <CoffeeCup className="h-8 w-auto text-[#2B2522]/70" />
      </Float>
      <p className="font-eyebrow relative text-[10px] text-[#2B2522]/60 sm:text-xs">{"// sebuah kisah"}</p>
      <h1 className="relative mt-2 font-script text-4xl font-bold leading-tight text-[#2B2522] sm:text-5xl">
        Kode &amp; Cinta
      </h1>
      <div className="relative mt-1 text-[#D2574A]">
        <Squiggle className="w-28 sm:w-36" delay={0.4} />
      </div>
      <p className="relative mt-2 font-poster text-lg text-[#3E4A6B] sm:text-xl">
        {groom} &amp; {bride}
      </p>
    </div>
  );
}

/** the last panel: every illustration so far, pinned up like a scrapbook */
function CollageArt() {
  const pins: { name: IllustrationKey; rotate: number }[] = [
    { name: "cafe", rotate: -4 },
    { name: "hello", rotate: 3 },
    { name: "dinner", rotate: 2 },
    { name: "champions", rotate: -3 },
  ];
  return (
    <div className="grid h-full w-full grid-cols-2 gap-[5%] p-[7%] pb-[20%]">
      {pins.map((p) => (
        <div
          key={p.name}
          className="bg-white p-[6%] shadow-[2px_3px_0_0_#E0CBA9]"
          style={{ transform: `rotate(${p.rotate}deg)` }}
        >
          <Illustration name={p.name} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

function AccentDoodle({ accent }: { accent: NonNullable<Scene["accent"]> }) {
  if (accent === "cup") return <CoffeeCup className="h-10 w-auto text-[#2B2522]" />;
  if (accent === "trophy") return <Trophy className="h-12 w-auto text-[#2B2522]" />;
  return <Heart color={BLUSH} className="h-9 w-auto text-[#2B2522]" />;
}

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

  const insetProps: InsetProps = { done, onDone, onFinish, onFlash: () => setFlash((f) => f + 1) };
  const inset = {
    heart: <HeartInset {...insetProps} />,
    chat: <ChatInset {...insetProps} groom={groom} bride={bride} />,
    camera: <CameraInset {...insetProps} />,
    plate: <PlateInset {...insetProps} />,
    trophy: <TrophyInset {...insetProps} />,
    envelope: <EnvelopeInset {...insetProps} />,
  }[scene.inset];

  return (
    <>
      <div className="relative" style={{ width: "var(--panel)", height: "var(--panel)" }}>
        <div
          className="wc crayon-box relative h-full w-full overflow-hidden rounded-[14px] bg-[#FFFDF8]"
          style={{ boxShadow: "6px 7px 0 0 #E9B5AA" }}
        >
          {scene.art.kind === "cover" ? (
            <CoverArt groom={groom} bride={bride} />
          ) : scene.art.kind === "collage" ? (
            <CollageArt />
          ) : (
            <Illustration
              name={scene.art.image}
              className="absolute inset-0 h-full w-full object-contain object-top p-[5%] pb-[15%]"
            />
          )}
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
            <AccentDoodle accent={scene.accent} />
          </Float>
        )}

        {/* Florence-style name tag over the panel */}
        <motion.div
          initial={false}
          animate={present ? { opacity: 1, x: 0, rotate: -2 } : { opacity: 0, x: -14, rotate: -6 }}
          transition={{ delay: present ? 0.15 : 0, type: "spring", stiffness: 240, damping: 20 }}
          className="wc crayon-box absolute -left-3 top-[7%] z-10 rounded-[8px] bg-[#FFFDF8] px-3 py-1.5 text-center"
        >
          <p className="font-poster text-sm leading-tight text-[#2B2522] sm:text-base">{scene.tag.title}</p>
          <p className="font-eyebrow text-[9px] text-[#2B2522]/55 sm:text-[10px]">{scene.tag.chapter}</p>
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
                    className="pointer-events-none absolute -bottom-3 -right-3 text-[#2B2522]"
                    animate={{ scale: [1, 0.82, 1], rotate: [-8, -14, -8] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: 1.2 }}
                  >
                    <Hand className="h-6 w-6 fill-[#FFFDF8]" />
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
      className={`relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#3E4A6B] font-poster text-[#FFF7EC] [perspective:220px] sm:h-14 ${
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
      <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[#27304A]" />
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
            className="wc crayon-box pointer-events-none absolute left-1/2 top-1 z-0 -ml-9 grid h-12 w-[4.5rem] place-items-center rounded-[6px] bg-[#FFFDF8] font-poster text-lg text-[#2B2522]/70"
          >
            {sh.label}
          </motion.div>
        ))}

        {/* binding rings */}
        <div className="absolute -top-3 left-0 right-0 z-20 flex justify-between px-10">
          {[0, 1].map((r) => (
            <span key={r} className="h-6 w-3 rounded-full border-2 border-[#2B2522] bg-[#FAF5EC]" />
          ))}
        </div>

        <motion.div
          animate={landed ? { scale: [1, 1.07, 1], rotate: [0, -1.5, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="wc crayon-box relative z-10 flex items-center gap-2.5 rounded-[12px] bg-[#FFFDF8] px-3.5 pb-3 pt-4 sm:gap-3"
          style={{ boxShadow: "5px 6px 0 0 #B5C5DE" }}
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
              <Heart color={BLUSH} animate={false} className="h-10 w-auto text-[#2B2522]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.p
        animate={landed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.45, y: 6, scale: 0.96 }}
        transition={{ duration: 0.45, delay: landed ? 0.5 : 0 }}
        className="mt-1 font-script text-2xl text-[#2B2522] sm:text-3xl"
      >
        {data.label}
      </motion.p>
    </div>
  );
}

/* ------------------------------------------------------------------ intro */

export default function ComicIntro({
  settings,
  story,
  onFinish,
}: {
  settings: Settings;
  story: StoryEvent[];
  onFinish: () => void;
}) {
  const { scenes, interludes } = buildStory(settings, story);
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

  useEffect(() => {
    if (eyes !== "open") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") tryNext();
      if ((e.key === "ArrowLeft" || e.key === "PageUp") && index > 0) go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [eyes, go, index, tryNext]);

  /* ---- swipe / drag the camera ---- */
  const drag = useRef<{ x0: number; c0: number; moved: boolean } | null>(null);
  const wheelLock = useRef(0);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (eyes !== "open" || e.button > 0) return;
    drag.current = { x0: e.clientX, c0: cam.get(), moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved) {
      if (Math.abs(e.clientX - d.x0) < 10) return;
      d.moved = true;
      d.x0 = e.clientX;
      d.c0 = cam.get();
      run.current++;
      pan.current?.stop();
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const base = index * seg;
    let next = d.c0 - (e.clientX - d.x0);
    // rubber-band: ahead of an unfinished panel, or past either end
    if (next > base && (!done[index] || index === last)) next = base + (next - base) * 0.22;
    if (next < 0) next *= 0.22;
    cam.set(next);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    const dx = e.clientX - d.x0;
    const threshold = Math.min(w * 0.12, 90);
    if (dx < -threshold && index < last) {
      if (done[index]) return go(index + 1);
      setNudge((k) => k + 1);
    } else if (dx > threshold && index > 0) {
      return go(index - 1);
    }
    go(index);
  };
  const onWheel = (e: ReactWheelEvent) => {
    if (eyes !== "open") return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 25 || Date.now() < wheelLock.current) return;
    wheelLock.current = Date.now() + 1300;
    if (delta > 0) tryNext();
    else if (index > 0) go(index - 1);
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
      className="fixed inset-0 z-50 overflow-clip bg-[#FAF5EC]"
      style={
        {
          "--panel": `${panel}px`,
          "--below": `calc(${panel}px * 0.17 + 8.5rem)`,
        } as CSSProperties
      }
    >
      <WashBackdrop />

      {/* the comic strip — the camera slides along it */}
      <div
        className="absolute inset-0 touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
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
      </div>

      {/* chapter dots */}
      <div className="pointer-events-none absolute left-1/2 top-6 z-30 flex -translate-x-1/2 gap-2">
        {scenes.map((s, i) => (
          <motion.span
            key={s.key}
            className="h-2 rounded-full"
            animate={{
              width: i === index ? 22 : 8,
              backgroundColor: i <= index ? NAVY : "rgba(43,37,34,0.18)",
            }}
          />
        ))}
      </div>

      <button
        onClick={onFinish}
        className="wc crayon-pill absolute right-5 top-4 z-30 rounded-full bg-[#FFFDF8] px-4 py-1.5 font-code text-xs text-[#2B2522]/80 transition-transform hover:-translate-y-0.5"
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
            onClick={() => go(index - 1)}
            aria-label="Panel sebelumnya"
            className="wc crayon-pill absolute bottom-6 left-5 z-30 grid h-10 w-10 place-items-center rounded-full bg-[#FFFDF8] text-[#2B2522]/70"
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
            className="wc crayon-pill absolute bottom-6 right-5 z-30 flex items-center gap-2 rounded-full bg-[#FFFDF8] px-4 py-2 font-code text-xs text-[#2B2522]"
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

      {/* opening: the screen starts black, tap and the eyes blink open */}
      {eyes !== "open" && (
        <div className="absolute inset-0 z-40">
          <motion.div
            className="absolute inset-x-0 top-0 h-[56%] bg-[#1F1A17]"
            style={{ borderRadius: "0 0 50% 50% / 0 0 22% 22%" }}
            initial={false}
            animate={eyes === "opening" ? { y: ["0%", "-40%", "-8%", "-102%"] } : { y: "0%" }}
            transition={{ duration: reduce ? 0.3 : 1.5, times: [0, 0.35, 0.55, 1], ease: "easeInOut" }}
            onAnimationComplete={() => eyes === "opening" && setEyes("open")}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-[56%] bg-[#1F1A17]"
            style={{ borderRadius: "50% 50% 0 0 / 22% 22% 0 0" }}
            initial={false}
            animate={eyes === "opening" ? { y: ["0%", "40%", "8%", "102%"] } : { y: "0%" }}
            transition={{ duration: reduce ? 0.3 : 1.5, times: [0, 0.35, 0.55, 1], ease: "easeInOut" }}
          />
          <AnimatePresence>
            {eyes === "closed" && (
              <motion.button
                key="wake"
                type="button"
                onClick={() => setEyes("opening")}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-[#FFF7EC]"
              >
                <motion.span
                  animate={{ scale: [1, 0.85, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Hand className="h-8 w-8" />
                </motion.span>
                <span className="font-script text-2xl sm:text-3xl">ketuk untuk membuka mata</span>
                <span className="font-eyebrow text-[10px] text-[#FFF7EC]/50">{"// sebuah undangan interaktif"}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
