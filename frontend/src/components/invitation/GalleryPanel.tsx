"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import type { GalleryImage } from "@/lib/types";
import { usePortalRoot } from "../ThemeProvider";
import { INK, TONES, type IllustrationKey } from "./watercolor";
import { Illustration } from "./WatercolorArt";

/** small, repeating tilts so the board looks hand-pinned rather than random every render */
const TILTS = [-2.2, 1.6, -1, 2.4, -1.6, 1];
const TAPES = [TONES.butter.bg, TONES.mauve.bg, TONES.teal.bg, TONES.sky.bg];

/** a photo in a polaroid frame with a strip of washi tape on top */
function Polaroid({
  index,
  caption,
  onClick,
  children,
}: {
  index: number;
  caption?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const tilt = TILTS[index % TILTS.length];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 14, rotate: tilt * 2 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ delay: Math.min(index, 10) * 0.05, type: "spring", stiffness: 220, damping: 20 }}
      whileHover={{ rotate: 0, scale: 1.03, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      className="relative mb-4 block w-full break-inside-avoid rounded-[6px] bg-white p-1.5 pb-0 text-left"
      style={{ boxShadow: "0 1px 0 rgba(43,37,34,0.15), 3px 5px 0 rgba(62,74,107,0.18)" }}
    >
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 z-10 h-4 w-12 -translate-x-1/2 opacity-80 mix-blend-multiply"
        style={{
          backgroundColor: TAPES[index % TAPES.length],
          rotate: `${-tilt * 2}deg`,
          clipPath: "polygon(3% 0, 97% 6%, 100% 94%, 0 100%)",
        }}
      />
      <span className="block overflow-hidden rounded-[3px]">{children}</span>
      <span
        className="font-script block min-h-[1.9rem] truncate px-1 pb-1 pt-1 text-lg leading-tight"
        style={{ color: INK }}
      >
        {caption}
      </span>
    </motion.button>
  );
}

function Lightbox({
  gallery,
  index,
  onStep,
  onJump,
  onClose,
}: {
  gallery: GalleryImage[];
  index: number;
  onStep: (dir: number) => void;
  onJump: (i: number) => void;
  onClose: () => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const img = gallery[index];
  const many = gallery.length > 1;

  // keep the active thumbnail in view
  useEffect(() => {
    strip.current
      ?.querySelector<HTMLElement>(`[data-i="${index}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 60) return;
    onStep(info.offset.x < 0 ? 1 : -1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3 bg-[#2B2522]/80 p-3 sm:p-6"
      onClick={onClose}
    >
      <div className="flex w-full max-w-2xl items-center justify-between text-[#FFF7EC]">
        <span className="font-code text-xs tabular-nums opacity-80">
          {index + 1} / {gallery.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Tutup foto"
          className="rounded-full crayon-pill bg-white/90 p-1 transition-transform hover:rotate-90"
          style={{ color: INK }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex w-full max-w-2xl min-h-0 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={img.id}
            initial={{ opacity: 0, x: 30, rotate: 1.5 }}
            animate={{ opacity: 1, x: 0, rotate: -0.6 }}
            exit={{ opacity: 0, x: -30, rotate: -2 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            drag={many ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={onDragEnd}
            className="max-w-full touch-pan-y rounded-[6px] bg-white p-2 pb-0"
            style={{ boxShadow: "8px 10px 0 0 rgba(62,74,107,0.45)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(img.image_url)}
              alt={img.caption || `Foto ${index + 1}`}
              draggable={false}
              className="max-h-[62dvh] w-auto max-w-full select-none rounded-[3px] object-contain"
            />
            <p className="font-script min-h-[2.4rem] px-1 py-1.5 text-center text-2xl leading-tight" style={{ color: INK }}>
              {img.caption}
            </p>
          </motion.div>
        </AnimatePresence>

        {many && (
          <>
            <button
              onClick={() => onStep(-1)}
              aria-label="Foto sebelumnya"
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full crayon-pill bg-white/90 p-1.5 sm:-left-14"
              style={{ color: INK }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => onStep(1)}
              aria-label="Foto berikutnya"
              className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full crayon-pill bg-white/90 p-1.5 sm:-right-14"
              style={{ color: INK }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {many && (
        <div
          ref={strip}
          onClick={(e) => e.stopPropagation()}
          className="flex w-full max-w-2xl gap-2 overflow-x-auto px-2 py-2 [scrollbar-width:none]"
        >
          {gallery.map((g, i) => (
            <button
              key={g.id}
              data-i={i}
              onClick={() => onJump(i)}
              aria-label={`Foto ${i + 1}`}
              className={`h-12 w-12 flex-none overflow-hidden rounded-[4px] bg-white p-0.5 transition ${
                i === index ? "scale-110 opacity-100 ring-2 ring-[#F2C66D]" : "opacity-55 hover:opacity-90"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(g.image_url)} alt="" className="h-full w-full rounded-[2px] object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const PLACEHOLDERS: IllustrationKey[] = ["cafe", "hello", "dinner", "champions"];

export function GalleryPanel({ gallery }: { gallery: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const portalRoot = usePortalRoot();

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: number) =>
      setOpenIndex((i) => (i === null ? null : (i + dir + gallery.length) % gallery.length)),
    [gallery.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [openIndex, close, step]);

  if (gallery.length === 0) {
    return (
      <div style={{ color: INK }}>
        <p className="font-script mb-4 text-2xl leading-snug opacity-80">
          Foto aslinya menyusul. Sementara, begini kira-kira kami berdua.
        </p>
        <div className="columns-2 gap-4">
          {PLACEHOLDERS.map((name, i) => (
            <Polaroid key={name} index={i}>
              <Illustration name={name} className="aspect-square w-full bg-white object-contain" />
            </Polaroid>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: INK }}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="font-script text-2xl leading-snug opacity-85">
          Potongan kecil cerita kami, ketuk untuk melihat lebih dekat.
        </p>
        <span
          className="flex-none rotate-2 rounded-full crayon-pill px-3 py-1 font-code text-[11px] tabular-nums"
          style={{ backgroundColor: TONES.teal.bg }}
        >
          {gallery.length} foto
        </span>
      </div>

      <div className="columns-2 gap-4 pt-2 sm:columns-3">
        {gallery.map((img, i) => (
          <Polaroid key={img.id} index={i} caption={img.caption} onClick={() => setOpenIndex(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(img.image_url)}
              alt={img.caption || `Foto ${i + 1}`}
              loading="lazy"
              className="block h-auto w-full"
            />
          </Polaroid>
        ))}
      </div>

      {/* portalled: the pop-up is transformed, which would trap a fixed overlay inside it */}
      {portalRoot &&
        createPortal(
          <AnimatePresence>
            {openIndex !== null && (
              <Lightbox
                gallery={gallery}
                index={openIndex}
                onStep={step}
                onJump={setOpenIndex}
                onClose={close}
              />
            )}
          </AnimatePresence>,
          portalRoot
        )}
    </div>
  );
}
