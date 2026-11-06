"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { NAVY } from "./watercolor";
import { Bubble, Dots, Frame, HeartRise, Hint, Stage, TimeTag, useAfter } from "./chapterKit";

/*
 * "Makan Siang Pertama": five drawings played like a little animation.
 * The groom sits alone at break (two frames flicking between a pout and a
 * blank stare), the guest makes the bride walk over and invite him, then
 * taps through their first chat at the warung (Attack on Titan, favourite
 * anime) until they both laugh.
 */

const FRAMES = [
  "/images/illustrations/lunch-1.jpg", // pouting at the laptop
  "/images/illustrations/lunch-2.jpg", // blank stare
  "/images/illustrations/lunch-3.jpg", // she comes over
  "/images/illustrations/lunch-4.jpg", // warung, talking
  "/images/illustrations/lunch-5.jpg", // warung, laughing
];

/** 0 alone at the desk · 1 invited · 2 chatting at the warung · 3 laughing */
type Step = 0 | 1 | 2 | 3;

export type LunchGame = ReturnType<typeof useLunch>;

export function useLunch({
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
  const [said, setSaid] = useState(0);
  const step: Step = done ? 3 : stepState;

  // let the laughing frame land before the strip unlocks
  useAfter(!done && stepState === 3, 1200, onDone);

  const chat = [
    { who: bride, me: false, text: "Kamu suka nonton anime nggak?" },
    { who: groom, me: true, text: "Suka! Lagi ngikutin Attack on Titan 😆" },
    { who: bride, me: false, text: "Sama!! Anime favoritmu apa?" },
    { who: groom, me: true, text: "Banyak… nanti tukeran list ya!" },
  ];

  return {
    step,
    said: done ? chat.length : said,
    chat,
    groom,
    bride,
    invite: () => setStep(1),
    go: () => setStep(2),
    talk: () => {
      const n = said + 1;
      setSaid(n);
      if (n >= chat.length) setStep(3);
    },
  };
}

/* ------------------------------------------------------------ main panel */

export function LunchArt({ game, active }: { game: LunchGame; active: boolean }) {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  // alone at break: flick between the pout and the stare, like a two-frame loop
  useEffect(() => {
    if (game.step !== 0 || !active || reduce) return;
    const t = setInterval(() => setTick((n) => n + 1), 1300);
    return () => clearInterval(t);
  }, [game.step, active, reduce]);

  const frame = game.step === 0 ? tick % 2 : game.step + 1;
  const time = game.step < 2 ? "12.00 · jam istirahat" : "12.15 · warung";

  return (
    <Stage>
      {/* desk frames swap quickly; scene changes get a slow cross-fade */}
      <Frame src={FRAMES[frame]} quick={game.step === 0} position={frame >= 3 ? "50% 62%" : "50% 40%"} />

      {/* the clock tag in the corner moves on with the story */}
      <TimeTag icon={<Clock className="h-3 w-3" />} text={time} />

      {/* the scene change to the warung, like a page turn */}
      <AnimatePresence>
        {game.step === 2 && game.said === 0 && (
          <motion.div
            key="wipe"
            className="pointer-events-none absolute inset-0 bg-[#FCFDF9]"
            initial={{ clipPath: "inset(0 0 0 100%)" }}
            animate={{ clipPath: ["inset(0 0 0 100%)", "inset(0 0 0 0%)", "inset(0 100% 0 0%)"] }}
            transition={{ duration: 0.9, times: [0, 0.45, 1], ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {game.step === 3 && <HeartRise />}
    </Stage>
  );
}

/* ----------------------------------------------------------------- inset */

export function LunchInset({ game }: { game: LunchGame }) {
  const { step, groom, bride } = game;
  const [replied, setReplied] = useState(false);

  // he takes a moment before answering
  useEffect(() => {
    if (step !== 1) return;
    const t = setTimeout(() => setReplied(true), 1100);
    return () => clearTimeout(t);
  }, [step]);

  if (step === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-center">
        <Hint>{groom} cuma duduk sendirian saat istirahat…</Hint>
        <motion.button
          type="button"
          onClick={game.invite}
          whileTap={{ scale: 0.92 }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="crayon-pill font-poster rounded-full px-4 py-1.5 text-xs text-[#F6FAF2] sm:text-sm"
          style={{ backgroundColor: NAVY }}
        >
          Ajak makan siang 🍱
        </motion.button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="flex h-full w-full flex-col justify-end gap-1 p-2">
        <Bubble me={false} who={bride} text={`${groom}, makan siang bareng yuk?`} />
        <AnimatePresence>
          {replied && <Bubble me who={groom} text="eh… b-boleh 😳" />}
        </AnimatePresence>
        {replied && (
          <motion.button
            type="button"
            onClick={game.go}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.92 }}
            className="crayon-pill font-poster self-center rounded-full bg-[#FCFDF9] px-3 py-0.5 text-[11px] text-[#2F3D35] sm:text-xs"
          >
            Berangkat! →
          </motion.button>
        )}
      </div>
    );
  }

  // the warung: tap through their first chat
  const shown = game.chat.slice(Math.max(0, game.said - 2), game.said);
  return (
    <button
      type="button"
      onClick={step === 2 ? game.talk : undefined}
      aria-label="Ketuk untuk mengobrol"
      className="flex h-full w-full flex-col justify-end gap-1 p-2 text-left"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {shown.map((m) => (
          <Bubble key={m.text} me={m.me} who={m.who} text={m.text} />
        ))}
      </AnimatePresence>
      <span className="flex items-center justify-between gap-2">
        <Hint>{step === 3 ? "dan obrolan pun mengalir ♡" : game.said === 0 ? "ketuk untuk mulai ngobrol" : "ketuk lagi…"}</Hint>
        <Dots count={game.chat.length} filled={game.said} color={NAVY} />
      </span>
    </button>
  );
}
