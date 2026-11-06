"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useInvitedGuest } from "./guest";
import { BLUSH, HONEY } from "./watercolor";
import { Emphasis, Heart } from "./WatercolorArt";

/*
 * The couple peeking around the portal window, like the art where they hold up
 * a blank board. Each cut-out ends in a straight edge where the board was. The
 * body is drawn behind the window with that edge tucked under it, and a second
 * copy showing only the hand sits in front, gripping the border.
 */

const ART = {
  // `edge` = where the straight cut sits, as a fraction of the image width;
  // `hand` = the same drawing with only the hand left, laid over the window border
  tiara: {
    src: "/images/illustrations/tiara.png",
    w: 242,
    h: 595,
    edge: 0.89,
    hand: "/images/illustrations/tiara-hand.png",
    alt: "Tiara mengintip dari balik undangan",
  },
  rafi: {
    src: "/images/illustrations/rafi.png",
    w: 264,
    h: 618,
    edge: 0.13,
    hand: "/images/illustrations/rafi-hand.png",
    alt: "Rafi mengintip dari balik undangan",
  },
} as const;

/**
 * how far the straight cut is tucked under the window. Kept small: everything
 * in this strip is hidden, and with more the sleeve vanishes and the hand on
 * the border looks cut off from the arm. So nothing may move them away from
 * the window (the lean goes toward it, the spring barely overshoots).
 */
const TUCK = 4;

type Who = keyof typeof ART;

/** a little four-point twinkle in honey crayon */
function Twinkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 1.5 C13 8 16 11 22.5 12 C16 13 13 16 12 22.5 C11 16 8 13 1.5 12 C8 11 11 8 12 1.5 Z"
        fill={HONEY}
        stroke="#2F3D35"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Bubble({ text, side }: { text: string | null; side: "left" | "right" }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.span
          key={text}
          initial={{ opacity: 0, scale: 0.6, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -6 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          className={`crayon-box font-heading pointer-events-none absolute bottom-full z-10 mb-1 w-max max-w-[150px] rounded-[12px] bg-[#FCFDF9] px-2.5 py-1 text-[13px] leading-tight text-[#2F3D35] shadow-[2px_3px_0_0_#C3D0AE] ${
            side === "left" ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right"
          }`}
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** pop a bubble for a few seconds */
function useBubble() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => setText(null), 3200);
    return () => clearTimeout(t);
  }, [text]);
  return [text, setText] as const;
}

const LINES: Record<Who, string[]> = {
  tiara: ["Datang ya! ♡", "Jangan lupa RSVP 😉", "Kami tunggu kamu!"],
  rafi: ["Ditunggu kehadirannya!", "Cek lokasinya ya 📍", "Doakan kami 🙏"],
};

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/**
 * Peekaboo timing: pop out, stay a few seconds, duck back behind the window,
 * then come back after a random pause. `out` turns true once fully out (the
 * caller reports it via `settled`). A tap (`stay`) restarts the time out.
 * With reduced motion they come out once and stay.
 */
function usePeekaboo(first: number) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(false);
  const [out, setOut] = useState(false);
  const [visits, setVisits] = useState(0);
  const [stay, setStay] = useState(0);

  useEffect(() => {
    let wait: number | null = null;
    if (!shown) wait = visits === 0 ? first : rand(4, 10);
    else if (out && !reduce) wait = rand(4.5, 7.5);
    if (wait === null) return;
    const t = setTimeout(() => {
      if (!shown) {
        setShown(true);
        setVisits((v) => v + 1);
      } else {
        setOut(false);
        setShown(false);
      }
    }, wait * 1000);
    return () => clearTimeout(t);
  }, [shown, out, visits, stay, first, reduce]);

  return {
    shown,
    out,
    visits,
    settled: (def: unknown) => def === "out" && setOut(true),
    keep: () => setStay((n) => n + 1),
  };
}

/**
 * One peeking character. Pops out from behind the window edge now and then,
 * grips the border, bobs, leans out a little, says something, and ducks
 * back; hops with a heart when tapped.
 */
function Peeker({
  who,
  delay,
  greeting,
  className,
}: {
  who: Who;
  delay: number;
  greeting: string;
  className: string;
}) {
  const art = ART[who];
  const left = who === "tiara";
  const reduce = useReducedMotion();
  const peek = usePeekaboo(delay);
  const { out } = peek;
  const [hops, setHops] = useState(0);
  const [bubble, say] = useBubble();
  const [line, setLine] = useState(0);

  // the hello on the first visit; after that, sometimes a line
  useEffect(() => {
    if (!out) return;
    if (peek.visits > 1 && Math.random() < 0.5) return;
    const text = peek.visits === 1 ? greeting : LINES[who][Math.floor(Math.random() * LINES[who].length)];
    const t = setTimeout(() => say(text), 300);
    return () => clearTimeout(t);
  }, [out, peek.visits, greeting, who, say]);

  // ducking back takes the bubble with them
  useEffect(() => {
    if (!peek.shown) say(null);
  }, [peek.shown, say]);

  const poke = () => {
    setHops((h) => h + 1);
    say(LINES[who][line % LINES[who].length]);
    setLine((l) => l + 1);
    peek.keep();
  };

  const edge = art.edge;
  // the cut sits TUCK px inside the window; the back copy is clipped at the window edge
  const box = {
    aspectRatio: `${art.w} / ${art.h}`,
    transform: left
      ? `translateX(calc(${-edge * 100}% + ${TUCK}px))`
      : `translateX(calc(${(1 - edge) * 100}% - ${TUCK}px))`,
  };
  const behindWindow = left
    ? `inset(-80% calc(${(1 - edge) * 100}% + ${TUCK}px) -30% -80%)`
    : `inset(-80% -80% -30% calc(${edge * 100}% + ${TUCK}px))`;

  /** the same motion for both copies, so the hand stays glued to the body */
  const figure = (front: boolean) => (
    <motion.span
      className="absolute inset-0 block"
      // "in" = fully behind the window, "out" = peeking
      variants={{
        in: { x: left ? `${edge * 100}%` : `${-(1 - edge) * 100}%`, transition: { duration: 0.45, ease: "easeIn" } },
        out: { x: 0, transition: { type: "spring", stiffness: 110, damping: 18 } },
      }}
      initial="in"
      animate={peek.shown ? "out" : "in"}
      onAnimationComplete={front ? undefined : peek.settled}
    >
      {/* idle: bob, plus a small lean in toward the window every few seconds */}
      <motion.span
        className="block h-full w-full"
        style={{ transformOrigin: left ? "100% 100%" : "0% 100%" }}
        animate={
          reduce || !out
            ? undefined
            : {
                x: left ? [0, 0, 6, 6, 0, 0] : [0, 0, -6, -6, 0, 0],
                rotate: left ? [0, 0, 2, 1, 0, 0] : [0, 0, -2, -1, 0, 0],
              }
        }
        transition={{ duration: 7, times: [0, 0.55, 0.62, 0.75, 0.82, 1], repeat: Infinity, delay: left ? 0 : 3.2 }}
      >
        <motion.span
          key={hops}
          className="block h-full w-full"
          animate={hops ? { y: [0, -18, 0, -6, 0] } : reduce ? undefined : { y: [0, -4, 0] }}
          transition={
            hops
              ? { duration: 0.6, ease: "easeOut" }
              : { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: left ? 0 : 0.8 }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={front ? art.hand : art.src}
            alt={front ? "" : art.alt}
            draggable={false}
            className="h-full w-full select-none drop-shadow-[2px_3px_0_rgba(47,61,53,0.12)]"
          />
        </motion.span>
      </motion.span>
    </motion.span>
  );

  return (
    <>
      {/* body, behind the window */}
      <div className={`absolute z-0 ${left ? "left-0" : "right-0"} ${className}`} style={{ ...box, clipPath: behindWindow }}>
        <button
          type="button"
          onClick={poke}
          aria-label={left ? "Sapa Tiara" : "Sapa Rafi"}
          className="pointer-events-auto absolute inset-0 block focus-visible:outline-none"
        >
          {figure(false)}
        </button>
      </div>

      {/* hand over the border, plus the doodles, hearts and speech bubble */}
      <div
        className={`pointer-events-none absolute z-20 ${left ? "left-0" : "right-0"} ${className}`}
        style={{ ...box, visibility: out ? "visible" : "hidden" }}
        aria-hidden
      >
        {figure(true)}

        {out && (
          <>
            <motion.span
              className={`absolute top-[-4%] ${left ? "left-[-6%]" : "right-[-6%]"}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1, y: [0, -6, 0], rotate: [-8, 6, -8] }}
              transition={{
                scale: { type: "spring", stiffness: 300, damping: 12 },
                y: { duration: 3, repeat: Infinity },
                rotate: { duration: 3, repeat: Infinity },
              }}
            >
              <Heart color={BLUSH} animate={false} className="h-6 w-auto text-[#2F3D35]" />
            </motion.span>
            <motion.span
              className={`absolute top-[48%] ${left ? "left-[-18%]" : "right-[-18%]"}`}
              animate={{ scale: [0.6, 1, 0.6], rotate: [0, 45, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: left ? 0.4 : 1.1 }}
            >
              <Twinkle className="h-5 w-5" />
            </motion.span>
            <motion.span
              className={`absolute top-[10%] ${left ? "left-[-20%]" : "right-[-20%]"}`}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.5, delay: left ? 1 : 2 }}
            >
              <Emphasis className="h-7 w-auto" flip={!left} />
            </motion.span>
          </>
        )}

        {/* a heart pops out on every tap */}
        <AnimatePresence>
          {hops > 0 && (
            <motion.span
              key={hops}
              className="absolute left-1/2 top-0"
              initial={{ opacity: 1, y: 0, scale: 0.4 }}
              animate={{ opacity: 0, y: -46, scale: 1.2 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              <Heart color={BLUSH} animate={false} className="h-7 w-auto text-[#2F3D35]" />
            </motion.span>
          )}
        </AnimatePresence>

        <div className={`absolute top-[-2%] ${left ? "left-0" : "right-0"}`}>
          <Bubble text={bubble} side={left ? "left" : "right"} />
        </div>
      </div>
    </>
  );
}

/**
 * Wide screens: Tiara on the left edge of the window and Rafi on the right,
 * standing in the margin with a hand over the border.
 * Render inside a `relative` box that is exactly the window.
 */
export function PeekingCouple() {
  const guest = useInvitedGuest();
  const hello = guest?.name ? `Hai, ${guest.name.split(" ")[0]}! 👋` : "Hai! 👋";
  return (
    // no z-index here: the body and hand layers have to stack around the window itself
    <div className="pointer-events-none absolute inset-0 hidden xl:block">
      <Peeker who="tiara" delay={1.5} greeting={hello} className="top-[30%] w-[clamp(110px,calc((100vw-72rem)/2+46px),146px)]" />
      <Peeker who="rafi" delay={1.9} greeting="Selamat datang di undangan kami!" className="top-[26%] w-[clamp(116px,calc((100vw-72rem)/2+52px),156px)]" />
    </div>
  );
}

/** narrow screens: one head popping up at a bottom corner of the window, now and then */
function CornerPeeker({ who, side, delay, onSay }: { who: Who; side: "left" | "right"; delay: number; onSay: (text: string) => void }) {
  const art = ART[who];
  const peek = usePeekaboo(delay);
  const [hops, setHops] = useState(0);
  // the straight cut sits past the window edge, so the window clips it
  const x = side === "left" ? "-22%" : "20%";

  return (
    <motion.button
      type="button"
      aria-label={who === "tiara" ? "Sapa Tiara" : "Sapa Rafi"}
      onClick={() => {
        setHops((h) => h + 1);
        onSay(LINES[who][hops % LINES[who].length]);
        peek.keep();
      }}
      variants={{
        in: { y: "100%", x, transition: { duration: 0.4, ease: "easeIn" } },
        out: { y: "38%", x, transition: { type: "spring", stiffness: 140, damping: 14 } },
      }}
      initial="in"
      animate={peek.shown ? "out" : "in"}
      onAnimationComplete={peek.settled}
      className={`absolute bottom-0 w-[52px] sm:w-[64px] ${side === "left" ? "left-0" : "right-0"}`}
      style={{ aspectRatio: `${art.w} / ${art.h}` }}
    >
      <motion.span
        key={hops}
        className="block h-full w-full"
        animate={hops ? { y: [0, -14, 0] } : { y: [0, -3, 0], rotate: side === "left" ? [0, 3, 0] : [0, -3, 0] }}
        transition={hops ? { duration: 0.5 } : { duration: 2.8, repeat: Infinity }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.src} alt="" draggable={false} className="h-full w-full select-none" />
      </motion.span>
    </motion.button>
  );
}

/**
 * Narrow screens: just their heads popping up at the bottom corners of the
 * window (which clips them), Rafi from the left edge and Tiara from the right.
 */
export function PeekingCoupleCorners() {
  const [bubble, say] = useBubble();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden xl:hidden">
      <div className="pointer-events-auto">
        <CornerPeeker who="rafi" side="left" delay={1.4} onSay={say} />
        <CornerPeeker who="tiara" side="right" delay={3.2} onSay={say} />
      </div>
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
        <Bubble text={bubble} side="left" />
      </div>
    </div>
  );
}
