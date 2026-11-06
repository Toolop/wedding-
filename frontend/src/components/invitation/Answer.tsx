"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { NAVY, RED } from "./watercolor";
import { HeartBurst } from "./WatercolorArt";
import { Dots, Frame, HeartRise, Hint, Stage, TimeTag, useAfter } from "./chapterKit";

/*
 * "Sebuah Jawaban": Pesta Buku at Taman Ismail Marzuki. The guest turns the
 * pages of a little book until it gives her answer, and the date gets
 * stamped onto the drawing.
 */

const SRC = "/images/illustrations/pesta-buku.jpg";

export type AnswerGame = ReturnType<typeof useAnswer>;

export function useAnswer({
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
  const pages = [
    "Setelah percakapan panjang…",
    `${groom} menunggu jawabannya.`,
    `Dan ${bride} pun menjawab:`,
    "“Iya.” ♡",
  ];
  const [pageState, setPage] = useState(0);
  const page = done ? pages.length - 1 : pageState;
  const answered = page === pages.length - 1;

  useAfter(!done && answered, 1500, onDone);

  return {
    pages,
    page,
    answered,
    turn: () => setPage((p) => Math.min(p + 1, pages.length - 1)),
  };
}

/* ------------------------------------------------------------ main panel */

export function AnswerArt({ game }: { game: AnswerGame }) {
  return (
    <Stage>
      <Frame src={SRC} position="50% 45%" />

      {/* the day it became official, stamped on */}
      <AnimatePresence>
        {game.answered && (
          <motion.span
            key="stamp"
            className="font-poster pointer-events-none absolute bottom-[3%] right-[3%] z-10 rounded-md border-[3px] px-1.5 py-0.5 text-xs leading-tight sm:text-base"
            style={{ color: RED, borderColor: RED, backgroundColor: "rgba(252,253,249,0.85)" }}
            initial={{ opacity: 0, scale: 2.2, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 16 }}
          >
            31 · 08 · 2024
            <span className="font-eyebrow block text-center text-[8px] sm:text-[9px]">resmi berdua ♡</span>
          </motion.span>
        )}
      </AnimatePresence>
      {game.answered && <HeartRise left={34} top={42} />}

      <TimeTag icon={<BookOpen className="h-3 w-3" />} text="Pesta Buku · TIM" />
    </Stage>
  );
}

/* ----------------------------------------------------------------- inset */

export function AnswerInset({ game }: { game: AnswerGame }) {
  const { pages, page, answered } = game;
  return (
    <button
      type="button"
      onClick={answered ? undefined : game.turn}
      aria-label="Ketuk untuk membalik halaman"
      className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 [perspective:600px]"
    >
      {/* each tap turns a page */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={page}
          initial={{ rotateY: 80, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -80, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ originX: 0 }}
          className={`font-script text-center leading-tight text-[#2F3D35] ${
            answered ? "text-2xl font-bold sm:text-3xl" : "text-lg sm:text-2xl"
          }`}
        >
          {pages[page]}
        </motion.span>
      </AnimatePresence>
      <span className="flex items-center gap-2">
        <Hint>{answered ? "31 Agustus 2024" : "ketuk untuk membalik halaman"}</Hint>
        <Dots count={pages.length} filled={page + 1} color={NAVY} />
      </span>
      {answered && <HeartBurst className="absolute -top-10 left-1/2 h-14 w-auto -translate-x-1/2 text-[#2F3D35]" />}
    </button>
  );
}
