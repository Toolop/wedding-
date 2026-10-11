"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MAP_FEATURES, MARKER_KINDS, type MapFeature, type MapMarker, type MapMeta, type MarkerKind } from "@/lib/map-meta";
import { INK, NAVY, PAPER, RED } from "./watercolor";

/** the cream of the scrapbook cards on the couple's illustrated map */
const SCRAP = "#F4E7CD";

/* ---------------------------------------------------------------- pieces */

/** the venue pin, drawn like the red pin on the illustrated map */
export function VenuePin({ size, color = RED }: { size: number; color?: string }) {
  return (
    <svg viewBox="0 0 40 52" width={size} height={size * 1.3} aria-hidden className="drop-shadow-[1px_2px_0_rgba(43,37,34,0.35)]">
      <path
        d="M20 50 C20 50 4 31 4 19 C4 9.6 11.2 3 20 3 C28.8 3 36 9.6 36 19 C36 31 20 50 20 50 Z"
        fill={color}
        stroke={INK}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <circle cx="20" cy="19" r="6.5" fill="#FFFDF8" stroke={INK} strokeWidth={2} />
      <path d="M11 13 C12.5 9.5 15 8 17.5 7.6" stroke="#fff" strokeOpacity={0.6} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </svg>
  );
}

function FeatureSwatch({ feature }: { feature: MapFeature }) {
  switch (feature) {
    case "sungai":
      return (
        <svg viewBox="0 0 28 12" className="h-3 w-7" aria-hidden>
          <path d="M1 7 C6 2 9 11 14 6 C19 1 22 10 27 5" stroke="#6CC4D6" strokeWidth={4} fill="none" strokeLinecap="round" />
        </svg>
      );
    case "jalan":
      return <span className="block h-2.5 w-7 rounded-full border border-[#2B2522]/30" style={{ backgroundColor: "#A7A3C4" }} />;
    case "gang":
      return <span className="block h-1.5 w-7 rounded-full" style={{ backgroundColor: "#CBC8DC" }} />;
    case "bangunan":
      return <span className="block h-4 w-6 rounded-[2px] border-[1.5px] border-[#C9A96E]" style={{ backgroundColor: "#F6E3B4" }} />;
    case "taman":
      return (
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
          <circle cx="10" cy="8" r="6.5" fill="#9CC47A" stroke="#5E8F43" strokeWidth={1.5} />
          <path d="M10 13 V19" stroke="#7A5A3A" strokeWidth={2} strokeLinecap="round" />
        </svg>
      );
  }
}

function MarkerDot({ kind, size }: { kind: MarkerKind; size: number }) {
  const meta = MARKER_KINDS[kind];
  const Icon = meta.icon;
  return (
    <span
      className="grid flex-none place-items-center rounded-full border-2 border-white"
      style={{
        width: size,
        height: size,
        backgroundColor: meta.color,
        boxShadow: `0 0 0 1.5px ${INK}, 1px 2px 0 1.5px rgba(43,37,34,0.3)`,
      }}
    >
      <Icon className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2.6} />
    </span>
  );
}

/** deterministic ragged outline, so a card tears the same way on every render */
function tornPath(seed: number) {
  let n = seed * 9301 + 49297;
  const rnd = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const pts: string[] = [];
  const step = 6;
  for (let x = 0; x <= 100; x += step) pts.push(`${x}% ${(rnd() * 3).toFixed(1)}%`);
  for (let y = step; y <= 100; y += step) pts.push(`${(100 - rnd() * 2.2).toFixed(1)}% ${y}%`);
  for (let x = 100 - step; x >= 0; x -= step) pts.push(`${x}% ${(100 - rnd() * 3).toFixed(1)}%`);
  for (let y = 100 - step; y > 0; y -= step) pts.push(`${(rnd() * 2.2).toFixed(1)}% ${y}%`);
  return `polygon(${pts.join(", ")})`;
}

/** a scrap of paper with torn, ink-lined edges and a strip of tape */
export function TornPaper({
  children,
  seed = 1,
  className = "",
  tape = "left",
}: {
  children: ReactNode;
  seed?: number;
  className?: string;
  tape?: "left" | "center" | "none";
}) {
  const clip = tornPath(seed);
  return (
    <div className={`relative ${className}`} style={{ filter: "drop-shadow(3px 4px 0 rgba(62,74,107,0.2))" }}>
      <div style={{ clipPath: clip, backgroundColor: INK, padding: 2 }}>
        <div className="wc" style={{ clipPath: clip, backgroundColor: SCRAP }}>
          {children}
        </div>
      </div>
      {tape !== "none" && (
        <span
          aria-hidden
          className={`absolute -top-2.5 h-5 w-16 opacity-85 ${tape === "left" ? "-left-3 -rotate-[28deg]" : "left-1/2 -translate-x-1/2 -rotate-3"}`}
          style={{ backgroundColor: "#E7D3A8", boxShadow: "inset 0 0 0 1px rgba(43,37,34,0.12)" }}
        />
      )}
    </div>
  );
}

/** little "look here" strokes, like the ones around the venue name on the illustrated map */
function Sparks({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M4 9 L9 11 M6 3 L10 8 M12 1 L12.5 7" stroke={NAVY} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/** the torn title card: venue name and address in navy ink */
export function VenueTitleCard({ venue, address, compact = false }: { venue: string; address: string; compact?: boolean }) {
  return (
    <TornPaper seed={3} className="rotate-[-1.6deg]">
      <div className={compact ? "px-4 pb-3 pt-3" : "px-5 pb-4 pt-4"} style={{ color: NAVY }}>
        <div className="flex items-start gap-1">
          <Sparks className="-ml-1 mt-1 h-5 w-5 flex-none" />
          <p className={`font-poster leading-[1.05] ${compact ? "text-xl" : "text-2xl sm:text-[28px]"}`}>{venue}</p>
          <Sparks className="ml-auto mt-0 h-5 w-5 flex-none -scale-x-100" />
        </div>
        {address && (
          <>
            <span aria-hidden className="my-2 block h-[2px] w-full rounded-full" style={{ backgroundColor: NAVY, opacity: 0.8 }} />
            <p className={`flex items-start gap-2 font-heading leading-snug ${compact ? "text-base" : "text-lg"}`}>
              <VenuePin size={compact ? 13 : 15} color={NAVY} />
              <span>{address}</span>
            </p>
          </>
        )}
      </div>
    </TornPaper>
  );
}

/** a photo of the venue in a polaroid frame, taped to the page */
export function VenuePolaroid({ src, caption }: { src: string; caption: string }) {
  return (
    <div
      className="relative w-full rounded-[4px] crayon-box bg-white p-2 pb-1"
      style={{ boxShadow: "3px 5px 0 rgba(62,74,107,0.2)" }}
    >
      <span
        aria-hidden
        className="absolute -top-2.5 left-1/2 z-10 h-5 w-14 -translate-x-1/2 -rotate-6 opacity-85"
        style={{ backgroundColor: "#E7D3A8" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Foto ${caption}`} className="block aspect-[4/3] w-full rounded-[2px] object-cover" />
      <p className="font-heading px-1 py-1.5 text-center text-[15px] leading-tight" style={{ color: NAVY }}>
        <span className="opacity-60">⸝ </span>
        {caption}
        <span className="opacity-60"> ⸜</span>
      </p>
    </div>
  );
}

export function Compass({ size, className = "", delay = 0.5 }: { size: number; className?: string; delay?: number }) {
  return (
    <motion.svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      aria-hidden
      initial={{ opacity: 0, scale: 0.3, rotate: -220 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.3, rotate: 120 }}
      transition={{ delay, type: "spring", stiffness: 90, damping: 11 }}
      className={className}
    >
      <path d="M30 8 L33.5 26.5 L52 30 L33.5 33.5 L30 52 L26.5 33.5 L8 30 L26.5 26.5 Z" fill="#9AA6C4" stroke={NAVY} strokeWidth={1.3} strokeLinejoin="round" />
      <path d="M30 4 L34 30 L30 56 L26 30 Z" fill={NAVY} stroke={NAVY} strokeWidth={1} strokeLinejoin="round" />
      <path d="M4 30 L30 26 L56 30 L30 34 Z" fill={NAVY} stroke={NAVY} strokeWidth={1} strokeLinejoin="round" />
      <path d="M30 4 L34 30 L30 30 Z M4 30 L30 26 L30 30 Z" fill="#B9C3DD" />
      <circle cx="30" cy="30" r="2.6" fill={PAPER} stroke={NAVY} strokeWidth={1.2} />
      {(
        [
          ["N", 30, 3],
          ["S", 30, 61],
          ["W", -1, 32],
          ["E", 61, 32],
        ] as const
      ).map(([l, x, y]) => (
        <text key={l} x={x} y={y} textAnchor="middle" fontSize="8" fontWeight="700" fill={NAVY} fontFamily="Fredoka, sans-serif">
          {l}
        </text>
      ))}
    </motion.svg>
  );
}

/** "Legenda:" on a torn scrap, every row in the couple's map key, compass in the corner */
export function MapLegend({ meta, wide = false }: { meta: MapMeta; wide?: boolean }) {
  const kinds = [...new Set(meta.markers.map((m) => m.kind))];
  const rows: { key: string; swatch: ReactNode; label: string }[] = [
    ...(meta.pin ? [{ key: "pin", swatch: <VenuePin size={14} />, label: "Lokasi" }] : []),
    ...kinds.map((k) => ({ key: k, swatch: <MarkerDot kind={k} size={18} />, label: MARKER_KINDS[k].label })),
    ...meta.features.map((f) => ({ key: f, swatch: <FeatureSwatch feature={f} />, label: MAP_FEATURES[f] })),
  ];
  if (rows.length === 0) return null;

  return (
    <TornPaper seed={7} tape="none" className="rotate-[0.8deg]">
      <div className="relative px-4 pb-4 pt-3" style={{ color: NAVY }}>
        <p className="font-poster text-xl leading-none">
          <span className="mr-1 opacity-60">·</span>Legenda:
        </p>
        <ul className={`mt-2.5 ${wide ? "grid grid-cols-2 gap-x-4 gap-y-1.5 pr-16" : "space-y-1.5 pr-14"}`}>
          {rows.map((r, i) => (
            <motion.li
              key={r.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.06 }}
              className="flex items-center gap-1.5"
            >
              <span className="flex w-7 flex-none justify-center">{r.swatch}</span>
              <span className="font-heading text-[15px] leading-tight">
                <span className="opacity-70">= </span>
                {r.label}
              </span>
            </motion.li>
          ))}
        </ul>
        <Compass size={58} className="absolute right-3 top-1/2 -translate-y-1/2" delay={0.7} />
      </div>
    </TornPaper>
  );
}

function Marker({
  marker,
  index,
  compact,
  active,
  onTap,
}: {
  marker: MapMarker;
  index: number;
  compact: boolean;
  active: boolean;
  onTap: () => void;
}) {
  const kind = MARKER_KINDS[marker.kind];
  const flip = marker.x > 72;
  const showLabel = marker.label && (!compact || active);
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      initial={{ opacity: 0, scale: 0, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0, transition: { delay: 0 } }}
      transition={{ delay: 0.3 + index * 0.07, type: "spring", stiffness: 380, damping: 16 }}
      className={`absolute z-10 flex items-center gap-1 ${flip ? "flex-row-reverse" : ""}`}
      style={{
        left: `${marker.x}%`,
        top: `${marker.y}%`,
        // keep the dot itself centred on the point whichever side the label sits
        translate: flip ? "calc(-100% + 11px) -50%" : "-11px -50%",
      }}
      aria-label={`${kind.label}${marker.label ? `: ${marker.label}` : ""}`}
    >
      <MarkerDot kind={marker.kind} size={compact ? 18 : 22} />
      <AnimatePresence>
        {showLabel && (
          <motion.span
            initial={{ opacity: 0, x: flip ? 6 : -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="whitespace-nowrap rounded-full bg-white/90 px-1.5 py-px font-heading text-[12px] leading-tight shadow-[1px_1px_0_rgba(43,37,34,0.2)]"
            style={{ color: kind.color }}
          >
            {marker.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ------------------------------------------------------------------- map */

/**
 * The couple's illustrated map with a live layer on top: a pulsing pin that,
 * when tapped, sends a ripple out and pops in the nearby places. `overlay`
 * renders extra cards on top of the map (used by the full-screen viewer).
 */
export function InteractiveMap({
  src,
  alt,
  meta,
  revealed,
  onToggle,
  onImageLoad,
  overlay,
}: {
  src: string;
  alt: string;
  meta: MapMeta;
  revealed: boolean;
  onToggle: () => void;
  onImageLoad?: () => void;
  overlay?: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = width > 0 && width < 440;
  const pin = meta.pin;
  const pinSize = compact ? 26 : 32;

  return (
    <div ref={root} className="relative overflow-hidden" style={{ color: INK }} onClick={() => setActiveMarker(null)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} draggable={false} onLoad={onImageLoad} className="block h-auto w-full select-none" />

      {/* a soft paper veil so the labels read clearly once everything is shown */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#FFFDF8]"
        animate={{ opacity: revealed ? 0.18 : 0 }}
      />

      <AnimatePresence>
        {revealed &&
          meta.markers.map((m, i) => (
            <Marker
              key={m.id}
              marker={m}
              index={i}
              compact={compact}
              active={activeMarker === m.id}
              onTap={() => setActiveMarker((cur) => (cur === m.id ? null : m.id))}
            />
          ))}
      </AnimatePresence>

      {pin && (
        <>
          {/* ripple that rolls out across the map when the pin is opened */}
          <AnimatePresence>
            {revealed && (
              <motion.span
                key="ripple"
                aria-hidden
                initial={{ scale: 0, opacity: 0.55 }}
                animate={{ scale: 9, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="pointer-events-none absolute z-10 h-10 w-10 rounded-full border-[3px]"
                style={{ left: `${pin.x}%`, top: `${pin.y}%`, translate: "-50% -50%", borderColor: RED }}
              />
            )}
          </AnimatePresence>

          {/* the pin itself: pulses and begs to be tapped until it's opened */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-pressed={revealed}
            aria-label={revealed ? "Sembunyikan keterangan peta" : "Tampilkan keterangan peta"}
            className="absolute z-40"
            style={{ left: `${pin.x}%`, top: `${pin.y}%`, translate: "-50% -100%" }}
            animate={revealed ? { y: [0, -14, 0], scale: [1, 1.15, 1] } : { y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-full h-3 w-8 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-[50%] border-2"
              style={{ borderColor: RED, animationDuration: "1.6s", display: revealed ? "none" : undefined }}
            />
            <VenuePin size={pinSize} />
            <AnimatePresence mode="wait">
              {revealed ? (
                <motion.span
                  key="here"
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: -6 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 14 }}
                  className="font-script pointer-events-none absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-px text-base leading-tight text-white shadow-[2px_2px_0_rgba(43,37,34,0.3)]"
                  style={{ backgroundColor: RED }}
                >
                  di sini!
                </motion.span>
              ) : (
                <motion.span
                  key="tap"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: [0, -4, 0] }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ y: { repeat: Infinity, duration: 1.6, ease: "easeInOut" } }}
                  className="font-script pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-base leading-tight shadow-[2px_2px_0_rgba(43,37,34,0.25)]"
                >
                  ketuk aku!
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </>
      )}

      {overlay}
    </div>
  );
}
