"use client";

import { AnimatePresence, motion, type Transition } from "framer-motion";

/*
 * The comic's opening: the guest starts with their eyes shut. A warm glow
 * breathes through the eyelids and a little crayon closed eye flutters, as
 * if about to wake. Tap, and two soft-edged eyelids crack open, blink, and
 * lift off the screen while light floods in (ComicIntro brings the blurry
 * world into focus behind them).
 */

const LID = "#1E2A23";
const CREAM = "#F6FAF2";

/**
 * The lid edge, in the lid's own 0–100 box: low at the corners, arching up in
 * the middle, so together the two lids open an almond from the centre out.
 */
const CORNER = 96;
const PEAK = 58;
const CTRL = 2 * PEAK - CORNER;

/** one eyelid with a feathered edge, like vision before it's quite awake; the lower one is flipped */
function Lid({ lower = false }: { lower?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full overflow-visible"
      style={{ transform: lower ? "scaleY(-1)" : undefined, filter: "blur(10px)" }}
      aria-hidden
    >
      {/* reaches well above its box so the lid still covers the screen while pushed shut */}
      <path d={`M-10 -80 H110 V${CORNER} Q50 ${CTRL} -10 ${CORNER} Z`} fill={LID} />
    </svg>
  );
}

/** two little crayon closed eyes in the middle of the dark screen, fast asleep */
function ClosedEyes() {
  return (
    <motion.svg
      viewBox="0 0 160 50"
      className="h-12 w-auto overflow-visible sm:h-14"
      // now and then they squeeze, like someone about to wake
      animate={{ scaleY: [1, 1, 0.7, 1, 0.82, 1] }}
      transition={{ duration: 3.6, times: [0, 0.6, 0.68, 0.76, 0.84, 0.92], repeat: Infinity }}
      aria-hidden
    >
      {["M10 18 Q35 46 60 18", "M100 18 Q125 46 150 18"].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke={CREAM}
          strokeWidth={4.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, delay: i * 0.25, ease: "easeInOut" }}
        />
      ))}
      {/* sleepy blush */}
      <ellipse cx="22" cy="40" rx="9" ry="4" fill="#E9A9A1" opacity={0.35} />
      <ellipse cx="138" cy="40" rx="9" ry="4" fill="#E9A9A1" opacity={0.35} />
    </motion.svg>
  );
}

export default function WakeUp({
  opening,
  reduce,
  onWake,
  onOpened,
}: {
  opening: boolean;
  reduce: boolean;
  onWake: () => void;
  onOpened: () => void;
}) {
  // shut (pushed together so the arches overlap), crack open, blink, then open wide
  const lift = (dir: 1 | -1) =>
    opening ? { y: [`${-dir * 20}%`, `${dir * 8}%`, `${-dir * 14}%`, `${dir * 135}%`] } : { y: `${-dir * 20}%` };
  const timing: Transition = { duration: reduce ? 0.3 : 2, times: [0, 0.3, 0.5, 1], ease: "easeInOut" };

  return (
    <div className="absolute inset-0 z-40">
      {/* light flooding in through the opening, then settling */}
      {opening && !reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,#FFFBEF_0%,rgba(255,251,239,0.6)_45%,transparent_80%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.35, 0.8, 0] }}
          transition={{ duration: 2.4, times: [0, 0.3, 0.5, 0.75, 1], ease: "easeInOut" }}
        />
      )}
      <motion.div
        className="absolute inset-x-0 top-0 h-[66%]"
        initial={false}
        animate={lift(-1)}
        transition={timing}
        onAnimationComplete={() => opening && onOpened()}
      >
        <Lid />
      </motion.div>
      <motion.div className="absolute inset-x-0 bottom-0 h-[66%]" initial={false} animate={lift(1)} transition={timing}>
        <Lid lower />
      </motion.div>

      <AnimatePresence>
        {!opening && (
          <motion.button
            key="wake"
            type="button"
            onClick={onWake}
            exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.25 } }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-[#F6FAF2]"
          >
            {/* light glowing through closed eyelids, breathing slowly */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(233,169,161,0.22),rgba(127,169,143,0.08)_38%,transparent_65%)]"
              animate={{ opacity: [0.55, 1, 0.55], scale: [0.96, 1.04, 0.96] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            />

            <span className="relative grid place-items-center">
              {/* a soft ripple says "tap here" */}
              {[0, 1].map((i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute h-24 w-24 rounded-full border border-[#F6FAF2]/40 sm:h-28 sm:w-28"
                  animate={{ scale: [0.6, 1.6], opacity: [0.7, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: 1 + i * 1.2, ease: "easeOut" }}
                />
              ))}
              <ClosedEyes />
              {/* still asleep */}
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="font-poster absolute text-[#F6FAF2]/60"
                  style={{ left: "92%", top: "-20%", fontSize: 11 + i * 4 }}
                  animate={{ x: [0, 10 + i * 6], y: [0, -26 - i * 10], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: 1.2 + i * 0.7, ease: "easeOut" }}
                >
                  z
                </motion.span>
              ))}
            </span>

            <span className="relative flex flex-col items-center gap-1.5">
              <span className="font-script text-2xl sm:text-3xl">ketuk untuk membuka mata</span>
              <span className="font-eyebrow text-[10px] text-[#F6FAF2]/50">{"// sebuah undangan interaktif"}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
