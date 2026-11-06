"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { MapPin, Search } from "lucide-react";
import { BLUSH, INK, NAVY, PAPER, RED } from "./watercolor";
import { Heart } from "./WatercolorArt";
import { useAfter } from "./chapterKit";

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
  src: "/images/illustrations/sucofindo-photo.jpg",
  faces: { groom: { x: 359, y: 116 }, bride: { x: 746, y: 158 } } as Faces,
};
/** the watercolour drawing of the same photo, revealed once they're found */
const ART = {
  src: "/images/illustrations/sucofindo.jpg",
  faces: { groom: { x: 330, y: 127 }, bride: { x: 722, y: 177 } } as Faces,
};
/** how close a tap has to land, in image pixels (photo neighbours sit ~45px apart) */
const HIT = 30;
const ZOOM = 4;
const ORDER: Who[] = ["bride", "groom"];
const MISS_LINES = ["Bukan, itu rekan kerja 😄", "Hmm, belum ketemu…", "Hampir! Coba lagi", "Itu teman satu divisi 😅"];

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
  const got = done ? ORDER : found;
  const want = ORDER.find((w) => !got.includes(w)) ?? null;
  const names: Record<Who, string> = { groom, bride };
  const drawn = done || painted;

  // both circled on the photo: hold a beat, paint the drawing in, then unlock the strip
  useAfter(!done && found.length === ORDER.length, 1000, () => setPainted(true));
  useAfter(!done && painted, 2000, onDone);

  const reveal = (who: Who) => {
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
      setNote(`Itu ${names[other]}! Tapi dia baru masuk sebulan kemudian, cari ${names[want]} dulu 😉`);
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
    /** after a few misses the target starts to glow */
    showRing: missCount >= 4,
    canHelp: missCount >= 3,
    pick,
    help: () => want && reveal(want),
  };
}

/* ------------------------------------------------------------ main panel */

/** a hand-drawn loop around a found face */
const LOOP = "M-50 -8 C-52 -44 -10 -62 22 -54 C56 -44 64 0 44 32 C24 58 -26 58 -46 30 C-56 14 -54 -4 -40 -22";

export function FindUsArt({ game, active }: { game: FindUsGame; active: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<{
    x: number;
    y: number;
    w: number;
    /** the pointer on screen, for placing the glass */
    cx: number;
    cy: number;
    touch: boolean;
  } | null>(null);
  const FACES = game.faces;
  // the drawing spreads out from between the two of them
  const cx = ((ART.faces.bride.x + ART.faces.groom.x) / 2 / IMG_W) * 100;
  const cy = ((ART.faces.bride.y + ART.faces.groom.y) / 2 / IMG_H) * 100;

  const at = (e: ReactPointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const fy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    return { x: fx, y: fy, w: r.width, cx: e.clientX, cy: e.clientY, touch: e.pointerType !== "mouse" };
  };
  const live = active && !!game.want;
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
          game.pick(p.x * IMG_W, p.y * IMG_H);
          if (p.touch) setLens(null);
        },
        onPointerCancel: () => setLens(null),
        onPointerLeave: (e: ReactPointerEvent<HTMLDivElement>) => e.pointerType === "mouse" && setLens(null),
      }
    : {};

  // the glass: big enough to make out faces in the photo on a phone
  const L = lens ? Math.min(Math.max(lens.w * 0.56, 150), 240) : 0;
  const glass = lens && {
    left: Math.min(Math.max(lens.cx - L / 2, 8), window.innerWidth - L - 8),
    // on touch it floats above the finger, or below it when there's no room up top
    top: !lens.touch ? lens.cy - L / 2 : lens.cy - L - 28 >= 8 ? lens.cy - L - 28 : lens.cy + 28,
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-[3%] pb-[22%] pt-[19%]">
      <span className="font-eyebrow mb-1.5 inline-flex items-center gap-1 self-end rounded-full bg-[#E4EEDF] px-2 py-0.5 text-[9px] text-[#2F3D35]/70 sm:text-[10px]">
        <MapPin className="h-3 w-3" /> Sucofindo
      </span>
      <div
        ref={box}
        {...handlers}
        className={`relative w-full touch-none select-none ${live ? "cursor-none" : ""}`}
        style={{ aspectRatio: `${IMG_W} / ${IMG_H}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PHOTO.src}
          alt="Foto bersama rekan kerja di Sucofindo"
          draggable={false}
          className="pointer-events-none h-full w-full rounded-[6px]"
        />
        {game.drawn && (
          <motion.img
            src={ART.src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full rounded-[6px] bg-[#FCFDF9]"
            initial={{ clipPath: `circle(0% at ${cx}% ${cy}%)` }}
            animate={{ clipPath: `circle(120% at ${cx}% ${cy}%)` }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        )}

        <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {/* the red thread between them once both are found */}
          {game.drawn && (
            <motion.path
              d={`M${FACES.bride.x - 40} ${FACES.bride.y - 40} C${FACES.bride.x - 120} ${FACES.groom.y - 160} ${FACES.groom.x + 140} ${FACES.groom.y - 170} ${FACES.groom.x + 44} ${FACES.groom.y - 40}`}
              fill="none"
              stroke={RED}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray="4 16"
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
                stroke={who === "bride" ? RED : NAVY}
                strokeWidth={9}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                // smaller loops on the photo, whose faces are smaller; redrawn once the drawing is in
                style={{ scale: game.drawn ? 1 : 0.6 }}
                transition={{ duration: 0.6, delay: game.drawn ? 0.9 : 0, ease: "easeInOut" }}
              />
            </g>
          ))}
          {game.showRing && game.want && (
            <motion.circle
              cx={FACES[game.want].x}
              cy={FACES[game.want].y}
              r={90}
              fill="none"
              stroke={RED}
              strokeWidth={6}
              strokeDasharray="14 12"
              animate={{ opacity: [0.15, 0.7, 0.15], scale: [1.15, 0.95, 1.15] }}
              style={{ transformOrigin: `${FACES[game.want].x}px ${FACES[game.want].y}px` }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          )}
        </svg>

        {/* name tags above the found faces */}
        {game.got.map((who) => (
          <motion.span
            key={`${game.drawn}-${who}`}
            initial={{ opacity: 0, y: 6, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: who === "bride" ? 4 : -4 }}
            transition={{ delay: game.drawn ? 1.1 : 0.35, type: "spring", stiffness: 320, damping: 14 }}
            className="font-poster pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full px-1.5 text-[9px] leading-tight text-[#F6FAF2] sm:text-[11px]"
            style={{
              left: `${(FACES[who].x / IMG_W) * 100}%`,
              top: `${((FACES[who].y - (game.drawn ? 66 : 42)) / IMG_H) * 100}%`,
              backgroundColor: who === "bride" ? RED : NAVY,
            }}
          >
            {game.names[who]}
          </motion.span>
        ))}

        {game.drawn && (
          <motion.span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${((FACES.bride.x + FACES.groom.x) / 2 / IMG_W) * 100}%`, top: "2%" }}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 8 }}
            transition={{ delay: 1.6, type: "spring", stiffness: 260, damping: 10 }}
          >
            <Heart color={BLUSH} animate={false} className="h-6 w-auto text-[#2F3D35] sm:h-8" />
          </motion.span>
        )}

        {/* wrong guesses: a quick crayon cross that fades away */}
        <AnimatePresence>
          {game.misses.map((m) => (
            <motion.span
              key={m.id}
              className="font-poster pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-base leading-none sm:text-lg"
              style={{ left: `${(m.x / IMG_W) * 100}%`, top: `${(m.y / IMG_H) * 100}%`, color: RED }}
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
            style={{ left: `${lens.x * 100}%`, top: `${lens.y * 100}%`, borderColor: RED }}
          />
        )}

        {/* magnifying glass: portalled to the page so the panel's edges and name tag never cover it */}
        {lens &&
          glass &&
          live &&
          createPortal(
            <div
              className="pointer-events-none fixed z-[70] rounded-full border-[3px] shadow-[3px_4px_0_0_rgba(47,61,53,0.3)]"
              style={{
                width: L,
                height: L,
                left: glass.left,
                top: glass.top,
                borderColor: INK,
                backgroundColor: PAPER,
                backgroundImage: `url(${PHOTO.src})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${lens.w * ZOOM}px auto`,
                backgroundPosition: `${L / 2 - lens.x * lens.w * ZOOM}px ${L / 2 - lens.y * (lens.w * (IMG_H / IMG_W)) * ZOOM}px`,
              }}
            >
              <span
                className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                style={{ borderColor: RED }}
              />
            </div>,
            document.body,
          )}
      </div>
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
        initial={found ? { scale: 0.5, rotate: -20 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
        className="relative h-9 w-9 flex-none sm:h-12 sm:w-12 overflow-hidden rounded-full border-2 border-dashed"
        style={{
          borderColor: found ? (who === "bride" ? RED : NAVY) : `${INK}55`,
          backgroundImage: found ? `url(${PHOTO.src})` : undefined,
          backgroundSize: `${k * 100}% auto`,
          backgroundPosition: `${px * 100}% ${py * 100}%`,
          backgroundColor: "#E4EEDF",
        }}
      >
        {!found && (
          <span className="font-poster absolute inset-0 grid place-items-center text-lg text-[#2F3D35]/45">?</span>
        )}
      </motion.div>
      <div className="min-w-0 text-left">
        <p className="font-poster truncate text-xs leading-tight text-[#2F3D35] sm:text-sm">{game.names[who]}</p>
        <p className="font-eyebrow truncate text-[8px] text-[#2F3D35]/55 sm:text-[9px]">{found ? "ketemu ✓" : sub}</p>
      </div>
    </div>
  );
}

export function FindUsInset({ game, done }: { game: FindUsGame; done: boolean }) {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1 px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <FaceSlot who="bride" game={game} sub="masuk duluan" />
        <FaceSlot who="groom" game={game} sub="sebulan kemudian" />
      </div>
      <div className="flex min-h-[1.5em] items-center justify-between gap-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={game.note ?? game.want ?? "done"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="font-eyebrow min-w-0 text-[8px] leading-tight text-[#2F3D35]/70 sm:text-[10px]"
          >
            {done || !game.want ? (
              "dua rekan kerja, belum saling kenal ♡"
            ) : (
              game.note ?? (
                <span className="inline-flex items-center gap-1">
                  <Search className="h-3 w-3" /> tahan & geser kaca pembesar, cari {game.names[game.want]}
                </span>
              )
            )}
          </motion.p>
        </AnimatePresence>
        {game.canHelp && game.want && (
          <button
            type="button"
            onClick={game.help}
            className="crayon-pill font-eyebrow flex-none rounded-full bg-[#FCFDF9] px-2 py-0.5 text-[8px] text-[#2F3D35] sm:text-[9px]"
          >
            tunjukkan
          </button>
        )}
      </div>
    </div>
  );
}
