"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Instagram, MapPin } from "lucide-react";
import { NAVY, RED } from "./watercolor";
import { Bubble, Dots, Frame, HeartRise, Hint, Stage, TimeTag, useAfter } from "./chapterKit";

/*
 * "Semakin Dekat": the office sports night at GBK, then the groom at home
 * following the bride on Instagram. She slides in on the other half of a
 * split screen, their real first DMs scroll by on a phone, and they both laugh.
 */

const SRC = {
  gbk: "/images/illustrations/gbk.jpg",
  bed: "/images/illustrations/gbk-bed.jpg",
  split: "/images/illustrations/gbk-split.jpg",
  laugh: "/images/illustrations/gbk-laugh.jpg",
};

/** the DM thread: three screenshots that overlap, so they read as one scroll */
const SHOTS = ["/images/illustrations/ig-1.jpg", "/images/illustrations/ig-2.jpg", "/images/illustrations/ig-3.jpg"];
const SHOT_NOTES = [
  "“Halo halo halo”… lalu promo Smartfren?! 😂",
  "“Saya unreg sj 🙏”",
  "“Sy juga membutuhkan ya bapak rafi 😂”",
];

/** the split frame's diagonal on the stage: x at the top edge and at the bottom edge */
const SPLIT = { top: 63.3, bottom: 34.5 };

/** 0 selfie at GBK · 1 home, finds her profile · 2 she pops up (split) · 3 reading the DMs · 4 laughing */
type Step = 0 | 1 | 2 | 3 | 4;

export type GbkGame = ReturnType<typeof useGbk>;

export function useGbk({
  done,
  onDone,
  onFlash,
  groom,
  bride,
}: {
  done: boolean;
  onDone: () => void;
  onFlash: () => void;
  groom: string;
  bride: string;
}) {
  const [stepState, setStep] = useState<Step>(0);
  const [snapped, setSnapped] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [page, setPage] = useState(0);
  const step: Step = done ? 4 : stepState;

  // the flash fades, then cut to him at home that night
  useAfter(snapped && stepState === 0, 900, () => setStep(1));
  useAfter(!done && stepState === 4, 1500, onDone);

  return {
    step,
    snapped: done || snapped,
    followed: done || followed,
    page: done ? SHOTS.length - 1 : page,
    groom,
    bride,
    snap: () => {
      if (snapped) return;
      onFlash();
      setSnapped(true);
    },
    follow: () => setFollowed(true),
    message: () => setStep(2),
    open: () => setStep(3),
    scroll: () => (page + 1 >= SHOTS.length ? setStep(4) : setPage(page + 1)),
  };
}

/* ------------------------------------------------------------ main panel */

/** a phone held up over the scene, slowly scrolling the real chat */
function PhoneThread({ page }: { page: number }) {
  return (
    <motion.div
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
      className="absolute inset-0 flex items-center justify-center py-[4%]"
    >
      <div className="relative aspect-[9/10] h-full overflow-hidden rounded-[16px] border-[5px] border-[#1E2A23] bg-black shadow-[4px_5px_0_0_rgba(30,42,35,0.35)]">
        <AnimatePresence>
          <motion.div
            key={page}
            className="absolute inset-0 bg-no-repeat"
            style={{ backgroundImage: `url(${SHOTS[page]})`, backgroundSize: "100% auto" }}
            initial={{ opacity: 0, backgroundPosition: "50% 0%" }}
            animate={{ opacity: 1, backgroundPosition: "50% 100%" }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.4 }, backgroundPosition: { duration: 7, delay: 0.6, ease: "easeInOut" } }}
          />
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function GbkArt({ game }: { game: GbkGame }) {
  const { step } = game;
  const src = step === 0 ? SRC.gbk : step <= 2 ? SRC.bed : step === 3 ? SRC.split : SRC.laugh;

  return (
    <Stage>
      <Frame src={src} position={step === 0 ? "50% 45%" : "50% 50%"} className={step === 3 ? "blur-[2px]" : ""} />

      {/* she appears: her half of the split screen slides in along the diagonal… */}
      {step === 2 && (
        <>
          <motion.div
            className="absolute inset-0"
            style={{ clipPath: `polygon(${SPLIT.top}% 0, 100% 0, 100% 100%, ${SPLIT.bottom}% 100%)` }}
            initial={{ x: "75%" }}
            animate={{ x: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 90, damping: 16 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SRC.split} alt="" draggable={false} className="h-full w-full select-none object-cover" />
          </motion.div>
          {/* …then his side settles into the same split frame */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SRC.split} alt="" draggable={false} className="h-full w-full select-none object-cover" />
          </motion.div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="absolute inset-0 bg-[#1E2A23]/30" />
          <PhoneThread page={game.page} />
        </>
      )}

      {step === 4 && (
        <>
          {["WKWK", "WKWKWK", "😂"].map((t, i) => (
            <motion.span
              key={t}
              className="font-poster pointer-events-none absolute z-10 text-lg sm:text-2xl"
              style={{ left: `${[6, 40, 46][i]}%`, top: `${[14, 16, 42][i]}%`, color: RED }}
              initial={{ opacity: 0, scale: 0.4, rotate: 0 }}
              animate={{ opacity: [0, 1, 1, 0.9], scale: 1, rotate: [-8, 6, -4][i] }}
              transition={{ delay: 0.2 + i * 0.25, type: "spring", stiffness: 260, damping: 12 }}
            >
              {t}
            </motion.span>
          ))}
          <HeartRise left={40} top={40} />
        </>
      )}

      <TimeTag
        icon={step === 0 ? <MapPin className="h-3 w-3" /> : <Instagram className="h-3 w-3" />}
        text={step === 0 ? "GBK · olahraga bareng" : step === 1 ? "malam itu · di rumah" : "Instagram · DM"}
      />
    </Stage>
  );
}

/* ----------------------------------------------------------------- inset */

export function GbkInset({ game }: { game: GbkGame }) {
  const { step, groom, bride } = game;
  const [greeted, setGreeted] = useState(false);
  useAfter(step === 2, 1500, () => setGreeted(true));

  if (step === 0) {
    return (
      <div className="flex h-full w-full items-center justify-between gap-2 px-3">
        <div className="flex flex-col items-start gap-1">
          <span className="font-poster text-sm leading-tight text-[#2F3D35] sm:text-base">Olahraga di GBK</span>
          <Hint>{game.snapped ? "cekrek! 📸" : "foto bareng teman kantor dulu"}</Hint>
        </div>
        <motion.button
          type="button"
          onClick={game.snap}
          whileTap={{ scale: 0.85 }}
          aria-label="Ambil foto bersama"
          className="crayon-pill grid h-11 w-11 flex-none place-items-center rounded-full bg-[#FCFDF9] sm:h-14 sm:w-14"
        >
          <span className="h-7 w-7 rounded-full sm:h-9 sm:w-9" style={{ background: RED }} />
        </motion.button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-1.5 px-3">
        <Hint>{groom} iseng membuka Instagram…</Hint>
        <div className="flex items-center gap-2.5">
          {/* her profile picture inside the story ring */}
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[conic-gradient(#E9A9A1,#E6CF8A,#C2676A,#9CC9AE,#E9A9A1)] sm:h-11 sm:w-11">
            <span className="h-[82%] w-[82%] rounded-full border-2 border-[#FCFDF9] bg-[radial-gradient(circle_at_50%_35%,#3F6B57_30%,#D98FB0_31%)]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-poster truncate text-sm leading-tight text-[#2F3D35] sm:text-base">{bride}</span>
            <Hint>@aralerosa</Hint>
          </span>
          <AnimatePresence mode="wait">
            {!game.followed ? (
              <motion.button
                key="follow"
                type="button"
                onClick={game.follow}
                // its own transition: the pulse below repeats forever and would never let it leave
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="crayon-pill font-poster rounded-full px-3 py-1 text-xs text-[#F6FAF2] sm:text-sm"
                style={{ backgroundColor: NAVY }}
              >
                Ikuti
              </motion.button>
            ) : (
              <motion.button
                key="dm"
                type="button"
                onClick={game.message}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.9 }}
                className="crayon-pill font-poster rounded-full bg-[#FCFDF9] px-3 py-1 text-xs text-[#2F3D35] sm:text-sm"
              >
                Kirim pesan
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {game.followed && <Hint>✓ mengikuti</Hint>}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex h-full w-full flex-col justify-end gap-1 p-2">
        <Bubble me who={groom} text="Halo halo halo" />
        {greeted ? (
          <motion.button
            type="button"
            onClick={game.open}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.92 }}
            className="crayon-pill font-poster self-center rounded-full bg-[#FCFDF9] px-3 py-0.5 text-[11px] text-[#2F3D35] sm:text-xs"
          >
            Lihat obrolannya →
          </motion.button>
        ) : (
          <span className="flex items-center gap-1.5 self-start">
            <span className="flex gap-0.5 rounded-full bg-[#F3DDD8] px-2 py-1.5">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="h-1 w-1 rounded-full bg-[#2F3D35]/60"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                />
              ))}
            </span>
            <Hint>{bride} mengetik…</Hint>
          </span>
        )}
      </div>
    );
  }

  if (step === 3) {
    return (
      <button
        type="button"
        onClick={game.scroll}
        aria-label="Ketuk untuk scroll obrolan"
        className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-center"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={game.page}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="font-script text-base leading-tight text-[#2F3D35] sm:text-xl"
          >
            {SHOT_NOTES[game.page]}
          </motion.span>
        </AnimatePresence>
        <span className="flex items-center gap-2">
          <Hint>ketuk untuk scroll</Hint>
          <Dots count={SHOTS.length} filled={game.page + 1} color={NAVY} />
        </span>
      </button>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
      <motion.span
        className="font-poster text-xl text-[#2F3D35] sm:text-2xl"
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 0.4, repeat: Infinity }}
      >
        WKWKWK 😂
      </motion.span>
      <Hint>dan mereka pun tertawa bersama ♡</Hint>
    </div>
  );
}
