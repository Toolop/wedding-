"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { mediaUrl } from "@/lib/api";
import type { GalleryImage } from "@/lib/types";
import SectionHeading from "./SectionHeading";

export default function Gallery({ gallery }: { gallery: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () =>
      setOpenIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length)),
    [gallery.length]
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % gallery.length)),
    [gallery.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, prev, next]);

  if (gallery.length === 0) return null;

  return (
    <section className="bg-secondary/40 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading label="Momen Berharga" title="Galeri Kami" />

        <div className="mt-14 columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
          {gallery.map((img, i) => (
            <motion.button
              key={img.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.06, duration: 0.5 }}
              onClick={() => setOpenIndex(i)}
              className="group relative block w-full break-inside-avoid overflow-hidden rounded-sm p-1.5 outline outline-1 outline-gold/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(img.image_url)}
                alt={img.caption || "Gallery"}
                className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-1.5 bg-primary/0 transition-colors duration-300 group-hover:bg-primary/10" />
              {img.caption && (
                <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 translate-y-full bg-gradient-to-t from-primary/80 to-transparent px-3 pb-2 pt-6 text-left font-serif text-sm text-surface opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {img.caption}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-4"
            onClick={close}
          >
            <button
              onClick={close}
              className="absolute right-5 top-5 text-white/80 transition-colors hover:text-white"
              aria-label="Tutup"
            >
              <X className="h-7 w-7" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-3 text-white/70 transition-colors hover:text-white sm:left-6"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <motion.img
              key={openIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={mediaUrl(gallery[openIndex].image_url)}
              alt={gallery[openIndex].caption || "Gallery"}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[82vh] max-w-[90vw] rounded-sm object-contain shadow-2xl"
            />
            {gallery[openIndex].caption && (
              <p className="mt-4 max-w-lg text-center font-serif text-lg italic text-white/85">
                {gallery[openIndex].caption}
              </p>
            )}
            <p className="mt-2 font-label text-[10px] text-white/40">
              {openIndex + 1} / {gallery.length}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-3 text-white/70 transition-colors hover:text-white sm:right-6"
              aria-label="Berikutnya"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
