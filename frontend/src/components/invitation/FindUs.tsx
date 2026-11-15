"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, Lightbulb, MapPin, MousePointerClick, Search } from "lucide-react";
import { colors, alpha } from "./theme";
import { useAfter } from "./chapterKit";
import { IMG } from "./assets";

/*
 * "Awal Pertemuan" mini-game: the real Sucofindo group photo, and the guest
 * has to spot the two of them with a magnifying glass. The bride joined
 * first, so she has to be found first; the groom "arrives" after. Once both
 * are found, the watercolour version of the photo paints in over it.
 */

type Who = "bride" | "groom";

type Faces = Record<Who, { x: number; y: number }>;

/** both pictures share one 1448×710 frame; face centres are in its pixels */
const IMG_W = 1448;
const IMG_H = 710;
/** the real photo, cropped to the drawing's frame: the search happens here */
const PHOTO = {
  src: IMG.sucofindoPhoto,
  faces: { groom: { x: 359, y: 116 }, bride: { x: 746, y: 158 } } as Faces,
};
/** the watercolour drawing of the same photo, revealed once they're found */
const ART = {
  src: IMG.sucofindo,
  faces: { groom: { x: 330, y: 127 }, bride: { x: 722, y: 177 } } as Faces,
};
/** the visible window of the picture: always the whole photo (nobody should be cut off) */
const FULL = { x0: 0, y0: 0, w: IMG_W, h: IMG_H };
const CROP = FULL;
/** how close a tap has to land, in image pixels (photo neighbours sit ~45px apart) */
const HIT = 36;
const ZOOM = 4;
const ORDER: Who[] = ["bride", "groom"];
const MISS_LINES = ["Bukan, itu rekan kerja.", "Hmm, belum ketemu…", "Hampir! Coba lagi.", "Itu teman satu divisi."];

type Mark = { id: number; x: number; y: number };

export type FindUsGame = ReturnType<typeof useFindUs>;

export function useFindUs({
  done,
  onDone,
  groom,
  bride,
}: {
  done: boolean;
  onDone: () => void;
  groom: string;
  bride: string;
}) {
  const [found, setFound] = useState<Who[]>([]);
  const [misses, setMisses] = useState<Mark[]>([]);
  const [missCount, setMissCount] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [painted, setPainted] = useState(false);
  // a short how-to opens first; the search only starts once the guest has read it
  const [tutorial, setTutorial] = useState(!done);
  const [hintOn, setHintOn] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(hintTimer.current), []);
  const got = done ? ORDER : found;
  const want = ORDER.find((w) => !got.includes(w)) ?? null;
  const names: Record<Who, string> = { groom, bride };
  const drawn = done || painted;

  // both circled on the photo: hold a beat, paint the drawing in, then unlock the strip
  useAfter(!done && found.length === ORDER.length, 1000, () => setPainted(true));
  useAfter(!done && painted, 2000, onDone);

  const reveal = (who: Who) => {
    setHintOn(false);
    setFound((f) => (f.includes(who) ? f : [...f, who]));
    setMissCount(0);
    setNote(who === "bride" ? `Ketemu ${bride}! Sekarang, sebulan kemudian…` : null);
  };

  /** x, y in image pixels */
  const pick = (x: number, y: number) => {
    if (!want) return;
    const near = (w: Who) => Math.hypot(x - PHOTO.faces[w].x, y - PHOTO.faces[w].y) <= HIT;
    if (near(want)) return reveal(want);
    const other = ORDER.find((w) => w !== want && !got.includes(w));
    if (other && near(other)) {
      setNote(`Itu ${names[other]}! Tapi dia baru masuk sebulan kemudian, cari ${names[want]} dulu.`);
      return;
    }
    const n = missCount + 1;
    setMissCount(n);
    setMisses((m) => [...m.slice(-3), { id: Date.now(), x, y }]);
    setNote(
      n >= 2
        ? want === "bride"
          ? "Petunjuk: hijab navy, di barisan belakang"
          : "Petunjuk: kemeja putih, paling belakang sebelah kiri"
        : MISS_LINES[(n - 1) % MISS_LINES.length]
    );
  };

  return {
    got,
    want,
    names,
    drawn,
    /** where the faces are in the picture currently on show */
    faces: drawn ? ART.faces : PHOTO.faces,
    misses,
    note,
    /** a wide search zone from the start that tightens with every miss */
    zone: missCount >= 4 ? { r: 70, off: 0 } : missCount >= 2 ? { r: 105, off: 0 } : { r: 190, off: 1 },
    /** what the one being searched for looks like */
    look:
      want === "bride"
        ? "hijab navy, barisan belakang"
        : "kemeja putih, paling belakang sebelah kiri",
    tutorial,
    closeTutorial: () => setTutorial(false),
    openTutorial: () => setTutorial(true),
    /** an arrow above the head of whoever is being searched for */
    hintOn,
    help: () => {
      if (!want) return;
      setHintOn(true);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHintOn(false), 6000);
    },
    pick,
  };
}

/* ------------------------------------------------------------ main panel */

/** a hand-drawn loop around a found face */
const LOOP = "M-50 -8 C-52 -44 -10 -62 22 -54 C56 -44 64 0 44 32 C24 58 -26 58 -46 30 C-56 14 -54 -4 -40 -22";

export function FindUsArt({ game, active }: { game: FindUsGame; active: boolean }) {
  const area = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<{ w: number; h: number } | null>(null);
  const [lens, setLens] = useState<{
    /** the pointer in image pixels */
    ix: number;
    iy: number;
    /** the pointer on screen, for placing the glass */
    cx: number;
    cy: number;
    touch: boolean;
  } | null>(null);
  const FACES = game.faces;
  const view = game.drawn ? FULL : CROP;
  // the drawing spreads out from between the two of them
  const cx = ((ART.faces.bride.x + ART.faces.groom.x) / 2 / IMG_W) * 100;
  const cy = ((ART.faces.bride.y + ART.faces.groom.y) / 2 / IMG_H) * 100;

  // the picture takes as much of the space as its shape allows
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const measure = () => setRoom({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const ratio = view.w / view.h;
  const boxW = room ? Math.min(room.w, room.h * ratio) : 0;
  const boxH = boxW / ratio;
  /** screen pixels per image pixel */
  const scale = boxW / view.w;

  const at = (e: ReactPointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const fy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    return {
      ix: view.x0 + fx * view.w,
      iy: view.y0 + fy * view.h,
      cx: e.clientX,
      cy: e.clientY,
      touch: e.pointerType !== "mouse",
    };
  };
  const live = active && !!game.want && !game.tutorial;
  const handlers = live
    ? {
        onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
          // keep the comic strip from treating this as a swipe
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          setLens(at(e));
        },
        onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
          e.stopPropagation();
          if (e.pointerType === "mouse" || e.buttons) setLens(at(e));
        },
        onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
          e.stopPropagation();
          const p = at(e);
          game.pick(p.ix, p.iy);
          if (p.touch) setLens(null);
        },
        onPointerCancel: () => setLens(null),
        onPointerLeave: (e: ReactPointerEvent<HTMLDivElement>) => e.pointerType === "mouse" && setLens(null),
      }
    : {};

  // the glass: big enough to make out faces in the photo on a phone
  const L = lens ? Math.min(Math.max(boxW * 0.5, 140), 230) : 0;
  const glass = lens && {
    left: Math.min(Math.max(lens.cx - L / 2, 8), window.innerWidth - L - 8),
    // on touch it floats above the finger, or below it when there's no room up top
    top: !lens.touch ? lens.cy - L / 2 : lens.cy - L - 28 >= 8 ? lens.cy - L - 28 : lens.cy + 28,
  };

  return (
    <div className="absolute inset-0 flex flex-col px-[3%] pb-[3%] pt-[68px]">
      <div ref={area} className="relative flex min-h-0 flex-1 items-center justify-center">
        <div
          ref={box}
          {...handlers}
          className={`relative touch-none select-none overflow-hidden rounded-[4px] ${live ? "cursor-none" : ""} ${room ? "" : "opacity-0"}`}
          style={{
            width: boxW,
            height: boxH,
            transition: game.drawn ? "width 1.2s ease-in-out, height 1.2s ease-in-out" : undefined,
          }}
        >
          <span className="font-eyebrow pointer-events-none absolute right-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-paper/90 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
            <MapPin className="h-3 w-3" strokeWidth={1.6} /> Sucofindo
          </span>

          {/* the whole picture; the box above shows only the window (`view`) of it */}
          <motion.div
            className="absolute"
            initial={false}
            animate={{
              left: `${(-view.x0 / view.w) * 100}%`,
              top: `${(-view.y0 / view.h) * 100}%`,
              width: `${(IMG_W / view.w) * 100}%`,
              height: `${(IMG_H / view.h) * 100}%`,
            }}
            transition={{ duration: game.drawn ? 1.2 : 0, ease: "easeInOut" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTO.src}
              alt="Foto bersama rekan kerja di Sucofindo"
              draggable={false}
              className="pointer-events-none h-full w-full"
            />
            {game.drawn && (
              <motion.img
                src={ART.src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full bg-paper"
                initial={{ clipPath: `circle(0% at ${cx}% ${cy}%)` }}
                animate={{ clipPath: `circle(120% at ${cx}% ${cy}%)` }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            )}

            <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              {/* the gold thread between them once both are found */}
              {game.drawn && (
                <motion.path
                  d={`M${FACES.bride.x - 40} ${FACES.bride.y - 40} C${FACES.bride.x - 120} ${FACES.groom.y - 160} ${FACES.groom.x + 140} ${FACES.groom.y - 170} ${FACES.groom.x + 44} ${FACES.groom.y - 40}`}
                  fill="none"
                  stroke={colors.gold}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray="4 14"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1, duration: 0.8, ease: "easeInOut" }}
                />
              )}
              {game.got.map((who) => (
                <g key={`${game.drawn}-${who}`} transform={`translate(${FACES[who].x} ${FACES[who].y})`}>
                  <motion.path
                    d={LOOP}
                    fill="none"
                    stroke={who === "bride" ? colors.gold : colors.brand}
                    strokeWidth={6}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    // smaller loops on the photo, whose faces are smaller; redrawn once the drawing is in
                    style={{ scale: game.drawn ? 1 : 0.6 }}
                    transition={{ duration: 0.6, delay: game.drawn ? 0.9 : 0, ease: "easeInOut" }}
                  />
                </g>
              ))}
              {game.want && !game.tutorial && (
                <motion.circle
                  key={game.zone.r}
                  cx={FACES[game.want].x + game.zone.off * 45}
                  cy={FACES[game.want].y + game.zone.off * 25}
                  r={game.zone.r}
                  fill="none"
                  stroke={colors.gold}
                  strokeWidth={4}
                  strokeDasharray="14 12"
                  animate={{ opacity: [0.3, 0.9, 0.3] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
              )}
            </svg>

            {/* name tags above the found faces */}
            {game.got.map((who) => (
              <motion.span
                key={`${game.drawn}-${who}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: game.drawn ? 1.1 : 0.35, duration: 0.5 }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full px-2.5 py-0.5 font-serif text-sm font-semibold leading-tight text-on-brand"
                style={{
                  left: `${(FACES[who].x / IMG_W) * 100}%`,
                  top: `${((FACES[who].y - (game.drawn ? 66 : 42)) / IMG_H) * 100}%`,
                  backgroundColor: who === "bride" ? colors.goldInk : colors.brand,
                }}
              >
                {game.names[who]}
              </motion.span>
            ))}

            {/* hint: an arrow bobbing right above the head of the one being searched for */}
            <AnimatePresence>
              {game.hintOn && game.want && (
                <motion.span
                  key={game.want}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${(FACES[game.want].x / IMG_W) * 100}%`,
                    top: `${((FACES[game.want].y - 32) / IMG_H) * 100}%`,
                  }}
                >
                  <motion.span
                    animate={{ y: [0, -7, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center"
                  >
                    <span className="whitespace-nowrap rounded-full bg-brand px-2.5 py-1 font-eyebrow text-[10px] uppercase tracking-[0.15em] text-on-brand">
                      {game.names[game.want]} di sini
                    </span>
                    <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden className="fill-brand">
                      <path d="M0 0h14L7 10z" />
                    </svg>
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>

            {game.drawn && (
              <motion.span
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-flourish text-2xl leading-none text-gold sm:text-3xl"
                style={{ left: `${((FACES.bride.x + FACES.groom.x) / 2 / IMG_W) * 100}%`, top: "4%" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.6 }}
              >
                &amp;
              </motion.span>
            )}

            {/* wrong guesses: a small cross that fades away */}
            <AnimatePresence>
              {game.misses.map((m) => (
                <motion.span
                  key={m.id}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-serif text-lg leading-none"
                  style={{ left: `${(m.x / IMG_W) * 100}%`, top: `${(m.y / IMG_H) * 100}%`, color: colors.goldInk }}
                  initial={{ opacity: 0, scale: 1.8 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
                  transition={{ duration: 1.1, times: [0, 0.15, 0.7, 1] }}
                >
                  ✕
                </motion.span>
              ))}
            </AnimatePresence>

            {/* where the finger is pointing, under the glass */}
            {lens && live && lens.touch && (
              <span
                className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                style={{ left: `${(lens.ix / IMG_W) * 100}%`, top: `${(lens.iy / IMG_H) * 100}%`, borderColor: colors.gold }}
              />
            )}
          </motion.div>

          {/* magnifying glass: portalled to the page so the panel's edges and name tag never cover it */}
          {lens &&
            glass &&
            live &&
            createPortal(
              <div
                className="pointer-events-none fixed z-[70] rounded-full border-[3px] shadow-paint-md"
                style={{
                  width: L,
                  height: L,
                  left: glass.left,
                  top: glass.top,
                  borderColor: colors.brand,
                  backgroundColor: colors.paper,
                  backgroundImage: `url(${PHOTO.src})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${IMG_W * scale * ZOOM}px auto`,
                  backgroundPosition: `${L / 2 - lens.ix * scale * ZOOM}px ${L / 2 - lens.iy * scale * ZOOM}px`,
                }}
              >
                <span
                  className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                  style={{ borderColor: colors.gold }}
                />
              </div>,
              document.body,
            )}
        </div>
      </div>

      {/* how to play: opens first, and again from the "?" button */}
      <AnimatePresence>
        {active && game.tutorial && game.want && (
          <motion.div
            key="how"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-[2%] z-30 flex flex-col justify-center gap-2 overflow-y-auto rounded-[4px] border border-gold-soft bg-paper/97 px-4 py-2.5 text-left"
          >
            <p className="font-eyebrow text-center text-[11px] uppercase tracking-[0.3em] text-gold-ink">Cara bermain</p>
            {[
              {
                icon: <Search className="h-4 w-4" strokeWidth={1.5} />,
                text: `Cari ${game.names[game.want]} dulu, lalu ${game.names[game.want === "bride" ? "groom" : "bride"]}. Mereka ada di lingkaran putus-putus.`,
              },
              {
                icon: <MousePointerClick className="h-4 w-4" strokeWidth={1.5} />,
                text: "Tahan & geser untuk kaca pembesar, lepas untuk memilih.",
              },
              {
                icon: <Lightbulb className="h-4 w-4" strokeWidth={1.5} />,
                text: "Bingung? Tekan Tunjukkan, panah muncul di atas kepalanya.",
              },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-gold-soft text-gold-ink">
                  {row.icon}
                </span>
                <p className="text-[13px] leading-snug text-ink sm:text-sm">{row.text}</p>
              </div>
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                game.closeTutorial();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="mx-auto mt-0.5 inline-flex min-h-11 items-center rounded-full bg-brand px-7 font-code text-sm text-on-brand transition-colors hover:bg-brand-hover"
            >
              Mulai mencari
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------------------------------------------- inset */

/** a round crop of their real face from the photo, revealed once found */
function FaceSlot({ who, game, sub }: { who: Who; game: FindUsGame; sub: string }) {
  const found = game.got.includes(who);
  const current = game.want === who;
  const face = PHOTO.faces[who];
  // background maths: zoom so a ~80px slice of the photo fills the circle
  const k = IMG_W / 80;
  const kh = k * (IMG_H / IMG_W);
  const px = ((face.x / IMG_W) * k - 0.5) / (k - 1);
  const py = ((face.y / IMG_H) * kh - 0.5) / (kh - 1);

  return (
    <div className={`flex min-w-0 flex-1 items-center gap-1.5 transition-opacity ${found || current ? "" : "opacity-45"}`}>
      <motion.div
        key={String(found)}
        initial={found ? { scale: 0.5} : false}
        animate={{ scale: 1}}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
        className="relative h-12 w-12 flex-none overflow-hidden rounded-full border sm:h-14 sm:w-14"
        style={{
          borderColor: found ? (who === "bride" ? colors.gold : colors.brand) : `${alpha(colors.ink, 33)}`,
          backgroundImage: found ? `url(${PHOTO.src})` : undefined,
          backgroundSize: `${k * 100}% auto`,
          backgroundPosition: `${px * 100}% ${py * 100}%`,
          backgroundColor: "var(--color-chrome)",
        }}
      >
        {!found && (
          <span className="absolute inset-0 grid place-items-center font-serif text-lg text-muted">?</span>
        )}
      </motion.div>
      <div className="min-w-0 text-left">
        <p className="truncate font-serif text-base font-semibold leading-tight text-ink sm:text-lg">{game.names[who]}</p>
        <p className="font-eyebrow truncate text-[10px] uppercase tracking-[0.12em] text-muted">{found ? "ketemu ✓" : sub}</p>
      </div>
    </div>
  );
}

export function FindUsInset({ game, done }: { game: FindUsGame; done: boolean }) {
  return (
    <div className="flex w-full flex-col justify-center gap-2.5 px-3.5 py-3">
      <div className="flex items-center gap-2">
        <FaceSlot who="bride" game={game} sub="masuk duluan" />
        <FaceSlot who="groom" game={game} sub="sebulan kemudian" />
      </div>
      <div className="flex min-h-[2.6em] items-center justify-between gap-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={game.note ?? game.want ?? "done"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="min-w-0 flex-1 text-[13px] leading-snug text-ink/80 sm:text-sm"
          >
            {done || !game.want
              ? "Dua rekan kerja, belum saling kenal."
              : game.tutorial
                ? "Baca dulu cara bermainnya ya."
                : (game.note ?? `Cari ${game.names[game.want]}: ${game.look}.`)}
          </motion.p>
        </AnimatePresence>
        {!done && game.want && !game.tutorial && (
          <span className="flex flex-none items-center gap-1.5">
            <button
              type="button"
              onClick={game.help}
              onPointerDown={(e) => e.stopPropagation()}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-gold bg-paper px-4 font-code text-[13px] text-ink transition-colors hover:bg-chrome"
            >
              <Lightbulb className="h-4 w-4 text-gold-ink" strokeWidth={1.5} />
              Tunjukkan
            </button>
            <button
              type="button"
              onClick={game.openTutorial}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Cara bermain"
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper text-muted transition-colors hover:border-gold"
            >
              <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
