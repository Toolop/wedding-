"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Clapperboard } from "lucide-react";
import { BLUSH, NAVY, RED } from "./watercolor";
import { Heart } from "./WatercolorArt";
import { Dots, Frame, HeartRise, Hint, Stage, TimeTag, useAfter } from "./chapterKit";

/*
 * "Nonton Berdua": their first movie, Look Back. Tear the ticket and the
 * screen lights up and starts flickering; then tap the popcorn and kernels
 * hop from the buckets to the two of them while they watch.
 */

const SRC = "/images/illustrations/lookback.jpg";
const BITES = 5;

/* spots on the stage (percent), measured on the drawing */
const SCREEN = { left: 19.7, top: 13.6, width: 60.9, height: 38.8 };
const LOVE = { left: 50.5, top: 62 };
/** from each bucket up to each of them */
const MOUTHS = [
  { from: [46, 77], to: [39, 62] },
  { from: [55, 82], to: [60, 73] },
] as const;

/** 0 ticket · 1 watching & snacking · 2 credits */
type Step = 0 | 1 | 2;

export type MovieGame = ReturnType<typeof useMovie>;

type Kernel = { id: number; who: 0 | 1 };

export function useMovie({ done, onDone }: { done: boolean; onDone: () => void }) {
  const [stepState, setStep] = useState<Step>(0);
  const [torn, setTorn] = useState(false);
  const [bites, setBites] = useState(0);
  const [kernels, setKernels] = useState<Kernel[]>([]);
  const nextId = useRef(0);
  const step: Step = done ? 2 : stepState;

  /** one kernel hops from a bucket to whoever's eating */
  const pop = (who: 0 | 1) => {
    const id = ++nextId.current;
    setKernels((k) => [...k, { id, who }]);
    window.setTimeout(() => setKernels((k) => k.filter((x) => x.id !== id)), 1100);
  };

  useAfter(torn && stepState === 0, 700, () => setStep(1));
  useAfter(!done && stepState === 2, 1300, onDone);

  return {
    step,
    torn: done || torn,
    bites: done ? BITES : bites,
    kernels,
    pop,
    tear: () => setTorn(true),
    munch: () => {
      // every tap feeds both of them
      pop(0);
      window.setTimeout(() => pop(1), 180);
      const n = bites + 1;
      setBites(n);
      if (n >= BITES) setStep(2);
    },
  };
}

/* ------------------------------------------------------------ main panel */

export function MovieArt({ game, active }: { game: MovieGame; active: boolean }) {
  const reduce = useReducedMotion();
  const { kernels } = game;
  const playing = game.step >= 1;

  // while the film runs they keep snacking on their own
  const pop = useRef(game.pop);
  useEffect(() => {
    pop.current = game.pop;
  });
  useEffect(() => {
    if (!playing || !active || reduce) return;
    let who: 0 | 1 = 0;
    const t = setInterval(() => {
      pop.current(who);
      who = who ? 0 : 1;
    }, 1700);
    return () => clearInterval(t);
  }, [playing, active, reduce]);

  return (
    <Stage>
      <Frame src={SRC} />

      {/* the screen: dark until the ticket is torn, then it flickers with the film */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: `${SCREEN.left}%`,
          top: `${SCREEN.top}%`,
          width: `${SCREEN.width}%`,
          height: `${SCREEN.height}%`,
        }}
      >
        <AnimatePresence>
          {!playing && (
            <motion.div
              key="dark"
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#15191A]"
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            >
              <span className="font-poster text-base tracking-widest text-[#F6FAF2]/85 sm:text-xl">LOOK BACK</span>
              <span className="font-eyebrow text-[8px] text-[#F6FAF2]/45 sm:text-[10px]">segera dimulai</span>
            </motion.div>
          )}
        </AnimatePresence>
        {playing && !reduce && (
          <motion.div
            className="absolute inset-0 bg-white mix-blend-soft-light"
            animate={{ opacity: [0, 0.35, 0.05, 0.25, 0, 0.15, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
      {/* the screen's glow spilling over the seats */}
      {playing && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[50%] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,214,160,0.28),transparent_65%)]"
          animate={reduce ? undefined : { opacity: [0.6, 1, 0.7, 0.9, 0.6] }}
          transition={{ duration: 2.6, repeat: Infinity }}
        />
      )}

      {/* the little heart between them beats while they watch */}
      {playing && (
        <motion.span
          className="pointer-events-none absolute"
          style={{ left: `${LOVE.left}%`, top: `${LOVE.top}%`, x: "-50%", y: "-50%" }}
          animate={{ scale: [1, 1.35, 1, 1.2, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          <Heart color={BLUSH} animate={false} className="h-5 w-auto text-[#2F3D35] sm:h-6" />
        </motion.span>
      )}

      {/* popcorn hopping from the buckets */}
      {kernels.map((k) => {
        const m = MOUTHS[k.who];
        return (
          <motion.span
            key={k.id}
            className="pointer-events-none absolute h-2.5 w-2.5 rounded-full border border-[#2F3D35]/50 bg-[#FFF3C9] sm:h-3 sm:w-3"
            style={{ x: "-50%", y: "-50%" }}
            initial={{ left: `${m.from[0]}%`, top: `${m.from[1]}%`, scale: 0.6 }}
            animate={{
              left: [`${m.from[0]}%`, `${(m.from[0] + m.to[0]) / 2}%`, `${m.to[0]}%`],
              top: [`${m.from[1]}%`, `${Math.min(m.from[1], m.to[1]) - 10}%`, `${m.to[1]}%`],
              scale: [0.6, 1.1, 0.4],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        );
      })}
      {kernels.map((k) => (
        <motion.span
          key={`nyam-${k.id}`}
          className="font-poster pointer-events-none absolute text-[10px] text-[#FFE7A8] sm:text-xs"
          style={{ left: `${MOUTHS[k.who].to[0] + (k.who ? 4 : -9)}%`, top: `${MOUTHS[k.who].to[1] - 6}%` }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: [0, 1, 0], y: -6 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          nyam
        </motion.span>
      ))}

      {game.step === 2 && <HeartRise left={38} top={55} />}

      <TimeTag icon={<Clapperboard className="h-3 w-3" />} text="10 Agustus 2024 · bioskop" />
    </Stage>
  );
}

/* ----------------------------------------------------------------- inset */

export function MovieInset({ game }: { game: MovieGame }) {
  if (game.step === 0) {
    return (
      <button
        type="button"
        onClick={game.tear}
        aria-label="Sobek tiketnya"
        className="flex h-full w-full items-center justify-center gap-3 px-3"
      >
        {/* the ticket: tearing it sends the stub tumbling off */}
        <span className="relative flex h-[62%] items-stretch">
          <span className="flex flex-col justify-center rounded-l-md border-2 border-r-0 border-[#2F3D35]/70 bg-[#F3DDD8] px-2.5 sm:px-3.5">
            <span className="font-poster text-sm leading-none text-[#2F3D35] sm:text-base">LOOK BACK</span>
            <span className="font-eyebrow mt-1 text-[8px] text-[#2F3D35]/60 sm:text-[9px]">2 tiket</span>
          </span>
          <motion.span
            className="flex items-center rounded-r-md border-2 border-dashed border-[#2F3D35]/70 bg-[#F3DDD8] px-2"
            animate={game.torn ? { x: 18, y: 40, rotate: 35, opacity: 0 } : { rotate: [0, -3, 0] }}
            transition={game.torn ? { duration: 0.6, ease: "easeIn" } : { duration: 1.2, repeat: Infinity }}
          >
            <span className="font-eyebrow text-[8px] text-[#2F3D35]/70 [writing-mode:vertical-rl]">ADMIT 2</span>
          </motion.span>
        </span>
        <span className="flex flex-col items-start gap-1">
          <span className="font-poster text-sm text-[#2F3D35] sm:text-base">{game.torn ? "masuk!" : "Nonton berdua"}</span>
          <Hint>{game.torn ? "lampu dimatikan…" : "ketuk untuk sobek tiketnya"}</Hint>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={game.step === 1 ? game.munch : undefined}
      aria-label="Ketuk untuk makan popcorn"
      className="flex h-full w-full items-center justify-center gap-4 px-3"
    >
      {/* a striped popcorn bucket that hops on every bite */}
      <motion.span
        key={game.bites}
        initial={{ y: game.bites ? -6 : 0, rotate: game.bites ? -6 : 0 }}
        animate={{ y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 10 }}
        className="relative h-[66%] w-12 sm:w-16"
      >
        <span className="absolute inset-x-[6%] top-0 h-[34%] rounded-t-full bg-[#FFF3C9] shadow-[inset_0_-3px_0_#E6CF8A]" />
        <span
          className="absolute inset-x-0 bottom-0 top-[26%] border-2 border-[#2F3D35]/70"
          style={{
            clipPath: "polygon(0 0, 100% 0, 86% 100%, 14% 100%)",
            background: `repeating-linear-gradient(90deg, ${RED} 0 18%, #FCFDF9 18% 36%)`,
          }}
        />
      </motion.span>
      <span className="flex flex-col items-start gap-1">
        <span className="font-poster text-sm text-[#2F3D35] sm:text-base">
          {game.step === 2 ? "habis! 🍿" : "Ngemil popcorn"}
        </span>
        <Hint>{game.step === 2 ? "nonton berdua pertama kali ♡" : "ketuk sambil nonton"}</Hint>
        <Dots count={BITES} filled={game.bites} color={NAVY} />
      </span>
    </button>
  );
}
