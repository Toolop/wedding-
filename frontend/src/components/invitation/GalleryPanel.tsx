"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import type { GalleryImage } from "@/lib/types";
import { usePortalRoot } from "../ThemeProvider";
import { colors } from "./theme";
import { PhotoCorners } from "./classy";
import { type IllustrationKey } from "./assets";
import { Illustration } from "./WatercolorArt";

/** a print in the album: white mount with gold corners, no tilt */
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
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className="mb-4 block w-full break-inside-avoid text-left"
    >
      <PhotoCorners className="block w-full">
        <span className="block overflow-hidden">{children}</span>
        {caption && (
          <span className="font-script block truncate px-1 pb-1 pt-1.5 text-base leading-tight" style={{ color: colors.ink }}>
            {caption}
          </span>
        )}
      </PhotoCorners>
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
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3 bg-ink/80 p-3 sm:p-6"
      onClick={onClose}
    >
      <div className="flex w-full max-w-2xl items-center justify-between text-on-brand">
        <span className="font-code text-xs tabular-nums opacity-80">
          {index + 1} / {gallery.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Tutup foto"
          className="rounded-full crayon-pill bg-white/90 p-1 transition-transform hover:rotate-90"
          style={{ color: colors.ink }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex w-full max-w-2xl min-h-0 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={img.id}
            initial={{ opacity: 0, x: 30}}
            animate={{ opacity: 1, x: 0}}
            exit={{ opacity: 0, x: -30}}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            drag={many ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={onDragEnd}
            className="max-w-full touch-pan-y rounded-[6px] bg-white p-2 pb-0"
                      >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(img.image_url)}
              alt={img.caption || `Foto ${index + 1}`}
              draggable={false}
              className="max-h-[62dvh] w-auto max-w-full select-none rounded-[3px] object-contain"
            />
            <p className="font-script min-h-[2.4rem] px-1 py-1.5 text-center text-2xl leading-tight" style={{ color: colors.ink }}>
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
              style={{ color: colors.ink }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => onStep(1)}
              aria-label="Foto berikutnya"
              className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full crayon-pill bg-white/90 p-1.5 sm:-right-14"
              style={{ color: colors.ink }}
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
                i === index ? "scale-110 opacity-100 ring-2 ring-honey" : "opacity-55 hover:opacity-90"
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
      <div style={{ color: colors.ink }}>
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
    <div style={{ color: colors.ink }}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="font-script text-2xl leading-snug opacity-85">
          Potongan kecil cerita kami, ketuk untuk melihat lebih dekat.
        </p>
        <span
          className="flex-none rounded-full crayon-pill px-3 py-1 font-code text-[11px] tabular-nums"
          style={{ backgroundColor: colors.mistSoft }}
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
