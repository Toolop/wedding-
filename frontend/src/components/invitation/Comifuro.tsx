"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MapPin, TrainFront } from "lucide-react";
import { NAVY } from "./watercolor";
import { Bubble, Frame, HeartRise, Hint, Stage, TimeTag, useAfter } from "./chapterKit";

/*
 * "Hobi yang Sama": a day at Comifuro, then the ride home together. The
 * guest taps the train along its line, one stop per tap, and each stop
 * brings the next bit of their first long chat.
 */

const SRC = "/images/illustrations/comifuro.jpg";
const STOPS = 3;

/** 0 at the festival · 1 on the train · 2 home */
type Step = 0 | 1 | 2;

export type ComifuroGame = ReturnType<typeof useComifuro>;

export function useComifuro({
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
  const [rode, setRode] = useState(0);
  const step: Step = done ? 2 : stepState;

  useAfter(!done && stepState === 2, 1200, onDone);

  const chat = [
    { who: bride, me: false, text: "Seru banget ya hari ini!" },
    { who: groom, me: true, text: "Iya! Makasih udah ngajak 😆" },
    { who: bride, me: false, text: "Next event bareng lagi yuk ✨" },
  ];

  return {
    step,
    rode: done ? STOPS : rode,
    chat,
    leave: () => setStep(1),
    ride: () => {
      const n = rode + 1;
      setRode(n);
      if (n >= STOPS) setStep(2);
    },
  };
}

/* ------------------------------------------------------------ main panel */

export function ComifuroArt({ game, active }: { game: ComifuroGame; active: boolean }) {
  const onTrain = game.step >= 1;
  return (
    <Stage>
      <Frame src={SRC} position="50% 45%" />

      {/* festival sparkle */}
      {!onTrain &&
        active &&
        [
          [12, 18],
          [82, 30],
          [70, 62],
        ].map(([x, y], i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute text-lg text-[#FCFDF9] sm:text-2xl"
            style={{ left: `${x}%`, top: `${y}%`, textShadow: "0 0 6px #7A6FC0" }}
            animate={{ scale: [0.6, 1.15, 0.6], opacity: [0.4, 1, 0.4], rotate: [0, 30, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5 }}
          >
            ✦
          </motion.span>
        ))}

      {/* going home: the day turns to dusk and station lights stream past the window */}
      <AnimatePresence>
        {onTrain && (
          <motion.div
            key="dusk"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#2A3550]/55 via-[#E6A57A]/20 to-[#1E2A23]/50" />
            {[22, 48, 70].map((y, i) => (
              <motion.span
                key={y}
                className="absolute h-1.5 w-[30%] rounded-full bg-[#FFE7A8]/70 blur-[2px]"
                style={{ top: `${y}%` }}
                initial={{ left: "110%" }}
                animate={{ left: "-40%" }}
                transition={{ duration: 1.6 + i * 0.4, repeat: Infinity, delay: i * 0.7, ease: "linear" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {game.step === 2 && <HeartRise left={36} top={40} />}

      <TimeTag
        icon={onTrain ? <TrainFront className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
        text={onTrain ? "pulang bareng · kereta" : "Comifuro · ICE BSD"}
      />
    </Stage>
  );
}

/* ----------------------------------------------------------------- inset */

export function ComifuroInset({ game }: { game: ComifuroGame }) {
  const { step, rode } = game;

  if (step === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-center">
        <Hint>seharian keliling Comifuro bareng teman-teman…</Hint>
        <motion.button
          type="button"
          onClick={game.leave}
          whileTap={{ scale: 0.92 }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="crayon-pill font-poster rounded-full px-4 py-1.5 text-xs text-[#F6FAF2] sm:text-sm"
          style={{ backgroundColor: NAVY }}
        >
          Pulang bareng 🚆
        </motion.button>
      </div>
    );
  }

  const said = game.chat[rode - 1];
  return (
    <button
      type="button"
      onClick={step === 1 ? game.ride : undefined}
      aria-label="Ketuk untuk melaju ke stasiun berikutnya"
      className="flex h-full w-full flex-col justify-between gap-1 p-2 text-left"
    >
      <span className="flex min-h-[2.4em] flex-col justify-end">
        <AnimatePresence mode="popLayout" initial={false}>
          {said && <Bubble key={said.text} me={said.me} who={said.who} text={said.text} />}
        </AnimatePresence>
      </span>

      {/* the line: stations as dots, the train slides one stop per tap */}
      <span className="relative mx-3 block h-6">
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-[#2F3D35]/25" />
        {Array.from({ length: STOPS + 1 }, (_, i) => (
          <span
            key={i}
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#2F3D35]/60"
            style={{ left: `${(i / STOPS) * 100}%`, backgroundColor: i <= rode ? NAVY : "#FCFDF9" }}
          />
        ))}
        <motion.span
          className="absolute top-1/2 text-lg leading-none"
          animate={{ left: `${(rode / STOPS) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          style={{ x: "-50%", y: "-85%" }}
        >
          🚃
        </motion.span>
      </span>

      <span className="flex items-center justify-between">
        <Hint>ICE BSD</Hint>
        <Hint>{step === 2 ? "sampai ♡" : rode === 0 ? "ketuk untuk berangkat" : "ketuk lagi…"}</Hint>
        <Hint>🏠</Hint>
      </span>
    </button>
  );
}
