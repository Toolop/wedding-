"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BusFront } from "lucide-react";
import { BLUSH, NAVY, RED } from "./watercolor";
import { Heart } from "./WatercolorArt";
import { Bubble, Frame, HeartRise, Hint, Stage, TimeTag, useAfter, useHold } from "./chapterKit";
import { playBeat, playBurst, unlockAudio } from "./heartbeat";
import { duckMusic } from "./musicDuck";

/*
 * "Sebuah Pengakuan": the ride home on TransJakarta 9D. Hold to help the
 * groom gather his courage: his heartbeat thumps out loud, faster the longer
 * you hold, until it bursts. Then he hands over the SilverQueen and
 * confesses — his stop comes and he bolts, leaving the bride on the bus
 * holding the chocolate.
 */

const FRAMES = [
  "/images/illustrations/tj-1.jpg", // sitting side by side
  "/images/illustrations/tj-2.jpg", // he blurts it out
  "/images/illustrations/tj-3.jpg", // and runs for the door
  "/images/illustrations/tj-4.jpg", // her hands, the chocolate, the city at night
];

/** 0 working up the nerve · 1 confessing · 2 his stop · 3 he's gone */
type Step = 0 | 1 | 2 | 3;

export type ConfessGame = ReturnType<typeof useConfess>;

export function useConfess({
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
  const [stepState, setStep] = useState<Step>(0);
  const [given, setGiven] = useState(false);
  const [beat, setBeat] = useState(0);
  const [burst, setBurst] = useState(false);
  const burstNow = useRef(false);
  const step: Step = done ? 3 : stepState;
  const courage = useHold({
    done: done || stepState > 0,
    onFull: () => {
      burstNow.current = true;
      playBurst();
      setBurst(true);
      setStep(1);
    },
    seconds: 2.6,
  });

  // deg… deg… — a heartbeat while the button is held, quicker as the meter fills
  const progress = useRef(0);
  useEffect(() => {
    progress.current = courage.progress;
  });
  useEffect(() => {
    if (!courage.holding) return;
    // the song dips so the heartbeat is all you hear
    const release = duckMusic();
    let t = 0;
    const tick = () => {
      playBeat(progress.current);
      setBeat((b) => b + 1);
      t = window.setTimeout(tick, 900 - 660 * progress.current);
    };
    t = window.setTimeout(tick, 0);
    return () => {
      clearTimeout(t);
      // let go: the song comes back; after the burst, once it has rung out
      window.setTimeout(release, burstNow.current ? 1600 : 200);
    };
  }, [courage.holding]);

  // after the confession, the bus chimes for his stop
  useAfter(given && stepState === 1, 2600, () => setStep(2));
  useAfter(!done && stepState === 3, 1800, onDone);

  return {
    step,
    courage,
    /** counts heartbeats, so the hearts on screen can thump in time */
    beat,
    /** the heart just burst (cleared on a revisit) */
    burst: burst && !done,
    given: done || given,
    groom,
    bride,
    give: () => setGiven(true),
    run: () => setStep(3),
  };
}

/* ------------------------------------------------------------ main panel */

export function ConfessArt({ game }: { game: ConfessGame }) {
  const { step, courage } = game;
  const p = courage.progress;

  return (
    <Stage>
      <Frame src={FRAMES[step]} position={step === 3 ? "50% 50%" : "50% 0%"} />

      {/* his heart: thumps with every beat, bigger as the meter fills */}
      {step === 0 && (
        <>
          <motion.span
            key={`glow-${game.beat}`}
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_45%,rgba(194,103,106,0.55)_100%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: game.beat ? [0, 0.25 + p * 0.75, 0] : 0 }}
            transition={{ duration: 0.45 }}
          />
          <span className="pointer-events-none absolute right-[9%] top-[30%]" style={{ scale: 1 + p * 0.6 }}>
            <motion.span
              key={game.beat}
              className="block"
              initial={{ scale: 1 }}
              animate={game.beat ? { scale: [1, 1.35, 1.05, 1.22, 1] } : { scale: [1, 1.08, 1] }}
              transition={game.beat ? { duration: 0.42 } : { duration: 1.4, repeat: Infinity }}
            >
              <Heart color={BLUSH} animate={false} className="h-7 w-auto text-[#2F3D35] sm:h-9" />
            </motion.span>
          </span>
        </>
      )}

      {/* …and then it bursts */}
      {step === 1 && game.burst && <HeartBurstFx />}

      {/* the confession, scribbled over the frame */}
      {step === 1 && game.given && (
        <motion.span
          className="font-script pointer-events-none absolute bottom-[6%] left-1/2 z-10 whitespace-nowrap rounded-xl bg-[#FCFDF9]/90 px-3 py-0.5 text-lg text-[#2F3D35] sm:text-2xl"
          style={{ x: "-50%" }}
          initial={{ opacity: 0, scale: 0.5, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
        >
          aku suka kamu! ♡
        </motion.span>
      )}

      {/* the dash for the door */}
      {step === 2 &&
        [38, 52, 66].map((y, i) => (
          <motion.span
            key={y}
            className="pointer-events-none absolute h-0.5 w-[18%] rounded-full bg-[#FCFDF9]/90"
            style={{ top: `${y}%`, left: "44%" }}
            animate={{ x: ["0%", "-120%"], opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, repeatDelay: 0.4 }}
          />
        ))}

      {step === 3 && <HeartRise left={30} top={50} />}

      <TimeTag
        icon={<BusFront className="h-3 w-3" />}
        text={step === 3 ? "…dan dia kabur" : "pulang · malam"}
      />
    </Stage>
  );
}

/** the heart swells, pops in a flash and scatters into little hearts */
function HeartBurstFx() {
  const bits = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const r = 26 + (i % 3) * 8;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r * 1.2, rot: (i % 2 ? 1 : -1) * (20 + i * 7) };
  });
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <motion.div
        className="absolute inset-0 bg-[#FFF6F1]"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.span
        className="absolute right-[9%] top-[30%]"
        initial={{ scale: 1.6, opacity: 1 }}
        animate={{ scale: [1.6, 3.2], opacity: [1, 0] }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <Heart color={BLUSH} animate={false} className="h-9 w-auto text-[#2F3D35]" />
      </motion.span>
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute right-[11%] top-[32%]"
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
          animate={{ x: -b.x * 4.6, y: b.y * 4.6, scale: [0.4, 1, 0.8], opacity: [1, 1, 0], rotate: b.rot }}
          transition={{ duration: 1.3, ease: "easeOut" }}
        >
          <Heart color={i % 3 ? BLUSH : RED} animate={false} className="h-4 w-auto text-[#2F3D35] sm:h-5" />
        </motion.span>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- inset */

export function ConfessInset({ game }: { game: ConfessGame }) {
  const { step, groom, bride, courage } = game;
  const [puzzled, setPuzzled] = useState(false);
  useAfter(step === 1 && game.given, 1200, () => setPuzzled(true));

  if (step === 0) {
    return (
      <button
        type="button"
        aria-label="Tahan untuk mengumpulkan keberanian"
        {...courage.bind}
        onPointerDown={(e) => {
          unlockAudio();
          courage.bind.onPointerDown(e);
        }}
        onKeyDown={(e) => {
          unlockAudio();
          courage.bind.onKeyDown(e);
        }}
        className="flex h-full w-full touch-none select-none flex-col items-center justify-center gap-2 px-4 [-webkit-touch-callout:none]"
      >
        <span className="flex items-center gap-2">
          <motion.span
            key={game.beat}
            initial={{ scale: 1 }}
            animate={{ scale: game.beat ? [1, 1.3, 1, 1.15, 1] : 1 }}
            transition={{ duration: 0.4 }}
            className="block"
          >
            <Heart color={RED} animate={false} className="h-5 w-auto text-[#2F3D35] sm:h-6" />
          </motion.span>
          <span className="font-poster text-sm text-[#2F3D35] sm:text-base">Kumpulkan keberanian</span>
        </span>
        <span className="block h-3 w-full overflow-hidden rounded-full border-2 border-[#2F3D35]/60 bg-[#FCFDF9]">
          <span
            className="block h-full rounded-full"
            style={{ width: `${courage.progress * 100}%`, backgroundColor: RED }}
          />
        </span>
        <Hint>
          {!courage.holding
            ? "tahan untuk mengumpulkan keberanian 🔊"
            : courage.progress < 0.5
              ? "deg… deg…"
              : "deg-deg-deg-deg!"}
        </Hint>
      </button>
    );
  }

  if (step === 1) {
    return (
      <div className="flex h-full w-full flex-col justify-end gap-1 p-2">
        {!game.given ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
            <Hint>berbekal sebatang cokelat…</Hint>
            <motion.button
              type="button"
              onClick={game.give}
              whileTap={{ scale: 0.92 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="crayon-pill font-poster rounded-full px-4 py-1.5 text-xs text-[#F6FAF2] sm:text-sm"
              style={{ backgroundColor: NAVY }}
            >
              Kasih cokelat 🍫
            </motion.button>
          </div>
        ) : (
          <>
            <Bubble me who={groom} text="I-ini buat kamu… aku suka sama kamu!" />
            <AnimatePresence>{puzzled && <Bubble me={false} who={bride} text="eh?? 😳" />}</AnimatePresence>
          </>
        )}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-center">
        <motion.span
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-eyebrow rounded-full bg-[#2A3550] px-2.5 py-0.5 text-[9px] text-[#F6FAF2] sm:text-[10px]"
        >
          🔔 halte berikutnya…
        </motion.span>
        <Hint>itu halte tempat {groom} turun!</Hint>
        <motion.button
          type="button"
          onClick={game.run}
          whileTap={{ scale: 0.9, x: 10 }}
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="crayon-pill font-poster rounded-full bg-[#FCFDF9] px-4 py-1 text-xs text-[#2F3D35] sm:text-sm"
        >
          Kabur! 🏃💨
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-end gap-1 p-2">
      <Bubble me={false} who={bride} text="lho… dia kabur?! 😂" />
      <span className="self-center">
        <Hint>…dan sebatang SilverQueen ♡</Hint>
      </span>
    </div>
  );
}
