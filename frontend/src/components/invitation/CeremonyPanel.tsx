"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, ExternalLink, Map as MapIcon, MapPin, Maximize2, Minus, Plus, X } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import { parseDate, parseLooseDate } from "@/lib/dates";
import { parseMapMeta, type MapMeta } from "@/lib/map-meta";
import type { Settings } from "@/lib/types";
import { usePortalRoot } from "../ThemeProvider";
import { InteractiveMap, MapLegend, VenuePolaroid, VenueTitleCard } from "./InteractiveMap";
import { formatLongDate, splitTime } from "./PortalPanels";
import { BLUSH, INK, PAPER, TONES } from "./watercolor";
import { ClockFace, Heart, Illustration, Rings } from "./WatercolorArt";

type EventInfo = {
  key: "akad" | "resepsi";
  kicker: string;
  date: string;
  time: string;
  location: string;
  address: string;
  maps: string;
  mapImage: string;
  mapMeta: MapMeta;
  venuePhoto: string;
  tone: keyof typeof TONES;
  art: React.ReactNode;
};

/** one map per venue; akad and resepsi at the same place share a single map */
type VenueMap = {
  id: string;
  label: string;
  src: string;
  meta: MapMeta;
  venue: string;
  address: string;
  maps: string;
  photo: string;
  events: EventInfo["key"][];
};

const sameText = (a: string, b: string) => {
  const norm = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();
  return !!norm(a) && norm(a) === norm(b);
};

/** one stop on the day, drawn as an admission ticket: time stub | perforation | venue */
function EventTicket({
  event,
  showDate,
  index,
  onShowMap,
}: {
  event: EventInfo;
  showDate: boolean;
  index: number;
  onShowMap?: () => void;
}) {
  const t = TONES[event.tone];
  const time = splitTime(event.time);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, rotate: index % 2 ? 0.8 : -0.8 }}
      animate={{ opacity: 1, y: 0, rotate: index % 2 ? 0.4 : -0.4 }}
      transition={{ delay: 0.08 + index * 0.12, type: "spring", stiffness: 200, damping: 20 }}
      className="relative flex overflow-hidden rounded-[14px] crayon-box wc"
      style={{ backgroundColor: PAPER, boxShadow: `4px 5px 0 0 ${t.edge}` }}
    >
      <div
        className="wc flex w-[92px] flex-none flex-col items-center justify-center px-2 py-3 text-center"
        style={{ backgroundColor: t.bg, color: t.ink }}
      >
        {event.time ? (
          <>
            <span className="font-poster text-[26px] leading-none tabular-nums">{time.start}</span>
            {time.end && (
              <span className="font-heading mt-1 whitespace-nowrap text-base leading-none opacity-75">
                s/d {time.end}
              </span>
            )}
            {time.zone && <span className="font-eyebrow mt-1.5 text-[9px] uppercase opacity-60">{time.zone}</span>}
          </>
        ) : (
          <span className="font-heading text-lg opacity-60">TBA</span>
        )}
      </div>

      <div aria-hidden className="w-0 flex-none border-l-2 border-dotted" style={{ borderColor: `${INK}55` }} />

      <div className="min-w-0 flex-1 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-eyebrow text-[9px] uppercase opacity-55">
              {String(index + 1).padStart(2, "0")} · {showDate && event.date ? event.date : "Acara"}
            </p>
            <p className="font-poster text-xl leading-tight">{event.kicker}</p>
          </div>
          <div className="-mr-1 -mt-1 flex-none">{event.art}</div>
        </div>

        {event.location && <p className="font-heading mt-2 text-lg leading-snug">{event.location}</p>}
        {event.address && (
          <p className="mt-0.5 flex items-start gap-1 text-[13px] leading-snug opacity-70">
            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>{event.address}</span>
          </p>
        )}
        {(onShowMap || event.maps) && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {onShowMap && (
              <button
                onClick={onShowMap}
                className="inline-flex items-center gap-1.5 rounded-full crayon-pill px-3 py-1 font-code text-[11px] transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: t.bg }}
              >
                <MapIcon className="h-3 w-3" /> Lihat peta
              </button>
            )}
            {event.maps && (
              <a
                href={event.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full crayon-pill bg-white/80 px-3 py-1 font-code text-[11px] transition-transform hover:-translate-y-0.5"
              >
                Petunjuk arah <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const MAP_ZOOMS = [1, 1.6, 2.4, 3.5];

/** full-screen map: drag / scroll to pan, buttons or double-tap to zoom, pins still live */
function MapViewer({
  open,
  onClose,
  map,
  revealed,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  map: VenueMap;
  revealed: boolean;
  onToggle: () => void;
}) {
  const portalRoot = usePortalRoot();
  const box = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(0);
  // the point (0..1 of the image) kept under the viewport centre across zooms
  const focus = useRef({ x: 0.5, y: 0.5 });
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const recentre = useCallback(() => {
    const el = box.current;
    if (!el) return;
    el.scrollLeft = focus.current.x * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = focus.current.y * el.scrollHeight - el.clientHeight / 2;
  }, []);

  useLayoutEffect(recentre, [level, recentre]);

  useEffect(() => {
    if (!open) return;
    // open centred on the venue pin when there is one
    focus.current = map.meta.pin ? { x: map.meta.pin.x / 100, y: map.meta.pin.y / 100 } : { x: 0.5, y: 0.5 };
    // phones open zoomed in, otherwise a landscape map is a thin strip
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset zoom each time the map opens
    setLevel(window.innerWidth < 640 ? 2 : 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose, map.meta.pin]);

  const zoomTo = (next: number, at?: { x: number; y: number }) => {
    const el = box.current;
    if (el) {
      focus.current = at ?? {
        x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      };
    }
    setLevel(Math.max(0, Math.min(MAP_ZOOMS.length - 1, next)));
  };

  if (!portalRoot) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#3E4A6B]/70 p-3 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, rotate: -1.5 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[14px] crayon-box wc"
            style={{ backgroundColor: PAPER, color: INK, boxShadow: "8px 10px 0 0 rgba(62,74,107,0.4)" }}
          >
            <div className="crayon-rule-b flex items-center justify-between gap-3 px-4 py-2.5">
              <p className="font-heading truncate text-xl">{map.venue || map.label}</p>
              <button
                onClick={onClose}
                aria-label="Tutup peta"
                className="flex-none rounded-full crayon-pill bg-white/85 p-1 transition-transform hover:rotate-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              ref={box}
              className="max-h-[72vh] min-h-0 flex-1 cursor-grab overflow-auto overscroll-contain active:cursor-grabbing"
              onPointerDown={(e) => {
                if (e.pointerType !== "mouse" || !box.current) return;
                drag.current = { x: e.clientX, y: e.clientY, left: box.current.scrollLeft, top: box.current.scrollTop };
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d || !box.current) return;
                box.current.scrollLeft = d.left - (e.clientX - d.x);
                box.current.scrollTop = d.top - (e.clientY - d.y);
              }}
              onPointerUp={() => (drag.current = null)}
              onPointerLeave={() => (drag.current = null)}
              onDoubleClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const el = e.currentTarget;
                zoomTo(level === MAP_ZOOMS.length - 1 ? 0 : level + 1, {
                  x: (el.scrollLeft + e.clientX - r.left) / el.scrollWidth,
                  y: (el.scrollTop + e.clientY - r.top) / el.scrollHeight,
                });
              }}
            >
              <div style={{ width: `${MAP_ZOOMS[level] * 100}%` }}>
                <InteractiveMap
                  src={map.src}
                  alt={`Peta lokasi ${map.venue}`}
                  meta={map.meta}
                  revealed={revealed}
                  onToggle={onToggle}
                  onImageLoad={recentre}
                  overlay={
                    <AnimatePresence>
                      {revealed && (
                        <motion.div
                          key="legend"
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                          className="absolute bottom-4 left-4 z-30 w-[300px]"
                        >
                          <MapLegend meta={map.meta} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  }
                />
              </div>
            </div>

            <div className="crayon-rule-t flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => zoomTo(level - 1)}
                  disabled={level === 0}
                  aria-label="Perkecil"
                  className="rounded-full crayon-pill bg-white/85 p-1.5 transition-opacity disabled:opacity-35"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => zoomTo(level + 1)}
                  disabled={level === MAP_ZOOMS.length - 1}
                  aria-label="Perbesar"
                  className="rounded-full crayon-pill bg-white/85 p-1.5 transition-opacity disabled:opacity-35"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="font-script ml-1 hidden text-lg opacity-60 sm:inline">geser untuk menjelajah</span>
              </div>
              {map.maps && (
                <a
                  href={map.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full crayon-pill px-3 py-1.5 font-code text-[11px] text-[#FFF7EC] transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: TONES.magenta.bg }}
                >
                  Buka di Google Maps <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

/** the "Peta lokasi" block under the tickets: tabs per venue, the live map, and its controls */
function MapSection({
  maps,
  active,
  onSelect,
  revealed,
  onToggle,
  sectionRef,
}: {
  maps: VenueMap[];
  active: number;
  onSelect: (i: number) => void;
  revealed: boolean;
  onToggle: () => void;
  sectionRef: React.RefObject<HTMLElement | null>;
}) {
  const [zoomed, setZoomed] = useState(false);
  const closeZoom = useCallback(() => setZoomed(false), []);
  const map = maps[active];
  const [narrow, setNarrow] = useState(true);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < 420));
    ro.observe(el);
    return () => ro.disconnect();
  }, [sectionRef]);
  const hasLayer = !!map.meta.pin || map.meta.markers.length > 0;

  return (
    <section ref={sectionRef} className="scroll-mt-3 space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-2 font-heading text-2xl leading-none">
            Peta lokasi
            {maps.length === 1 && map.events.length > 1 && (
              <span
                className="rounded-full px-2 py-0.5 font-code text-[10px]"
                style={{ backgroundColor: TONES.mauve.bg }}
              >
                Akad &amp; Resepsi
              </span>
            )}
          </h4>
          {hasLayer && (
            <p className="font-script text-lg leading-tight opacity-70">
              {map.meta.pin ? "ketuk pin merah untuk melihat sekitarnya" : "buka keterangan untuk melihat sekitarnya"}
            </p>
          )}
        </div>
        {maps.length > 1 && (
          <div role="tablist" className="flex gap-1 rounded-full crayon-pill bg-white/70 p-1">
            {maps.map((m, i) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={i === active}
                onClick={() => onSelect(i)}
                className="relative rounded-full px-3 py-1 font-code text-[11px] transition-colors"
              >
                {i === active && (
                  <motion.span
                    layoutId="map-tab"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: TONES.magenta.bg }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative" style={{ color: i === active ? TONES.magenta.ink : INK }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={map.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="relative"
        >
          {/* torn title card, taped over the top edge of the map */}
          {(map.venue || map.address) && (
            <motion.div
              initial={{ opacity: 0, y: -10, rotate: -4 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="relative z-20 -mb-5 ml-1 mr-8 sm:mr-24"
            >
              <VenueTitleCard venue={map.venue} address={map.address} compact={narrow} />
            </motion.div>
          )}

          <div
            className="overflow-hidden rounded-[14px] crayon-box wc"
            style={{ backgroundColor: PAPER, boxShadow: `4px 5px 0 0 ${TONES.sky.edge}` }}
          >
            <InteractiveMap
              src={map.src}
              alt={`Peta lokasi ${map.venue}`}
              meta={map.meta}
              revealed={revealed}
              onToggle={onToggle}
            />
          </div>

          {/* polaroid of the venue and the map key, pinned under the map once it's opened */}
          <AnimatePresence initial={false}>
            {revealed && (
              <motion.div
                key="scrap"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div
                  className={`relative z-10 -mt-3 grid gap-3 px-1 pb-1 ${
                    map.photo && !narrow ? "grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-start" : ""
                  }`}
                >
                  {map.photo && (
                    <motion.div
                      initial={{ opacity: 0, y: 24, rotate: 6 }}
                      animate={{ opacity: 1, y: 0, rotate: -3 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 15 }}
                      className={narrow ? "mx-auto mt-2 w-3/5" : "mt-2"}
                    >
                      <VenuePolaroid src={map.photo} caption={map.venue} />
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 24, rotate: -4 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ delay: 0.32, type: "spring", stiffness: 180, damping: 16 }}
                    className="mt-4"
                  >
                    <MapLegend meta={map.meta} wide={!map.photo && !narrow} />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        {hasLayer && (
          <button
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 rounded-full crayon-pill px-3 py-1.5 font-code text-[11px] transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: revealed ? "rgba(255,255,255,0.8)" : TONES.butter.bg }}
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {revealed ? "Sembunyikan keterangan" : "Tampilkan keterangan"}
          </button>
        )}
        <button
          onClick={() => setZoomed(true)}
          className="inline-flex items-center gap-1.5 rounded-full crayon-pill bg-white/80 px-3 py-1.5 font-code text-[11px] transition-transform hover:-translate-y-0.5"
        >
          <Maximize2 className="h-3.5 w-3.5" /> Perbesar peta
        </button>
        {map.maps && (
          <a
            href={map.maps}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full crayon-pill px-3 py-1.5 font-code text-[11px] text-[#FFF7EC] transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: TONES.magenta.bg }}
          >
            Google Maps <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <MapViewer open={zoomed} onClose={closeZoom} map={map} revealed={revealed} onToggle={onToggle} />
    </section>
  );
}

export function CeremonyPanel({ settings }: { settings: Settings }) {
  const events = (
    [
      {
        key: "akad",
        kicker: "Akad Nikah",
        date: settings.akad_date,
        time: settings.akad_time,
        location: settings.akad_location,
        address: settings.akad_address,
        maps: settings.akad_maps_url,
        mapImage: settings.akad_map_image,
        mapMeta: parseMapMeta(settings.akad_map_meta),
        venuePhoto: settings.akad_venue_photo,
        tone: "cream",
        art: <Rings className="h-9 w-auto" />,
      },
      {
        key: "resepsi",
        kicker: "Resepsi",
        date: settings.resepsi_date,
        time: settings.resepsi_time,
        location: settings.resepsi_location,
        address: settings.resepsi_address,
        maps: settings.resepsi_maps_url,
        mapImage: settings.resepsi_map_image,
        mapMeta: parseMapMeta(settings.resepsi_map_meta),
        venuePhoto: settings.resepsi_venue_photo,
        tone: "sky",
        art: <Heart color={BLUSH} className="h-8 w-auto" delay={0.2} />,
      },
    ] satisfies EventInfo[]
  ).filter((e) => e.date || e.time || e.location);

  // one map per venue: events at the same place (same name or address) share it,
  // using whichever of them has a map — resepsi's first, since it's listed last
  const maps: VenueMap[] = [];
  for (const e of events) {
    const group = maps.find((m) =>
      m.events.some((k) => {
        const other = events.find((x) => x.key === k)!;
        return sameText(other.location, e.location) || sameText(other.address, e.address);
      })
    );
    if (group) {
      group.events.push(e.key);
      group.label = "Akad & Resepsi";
      if (e.mapImage) {
        group.src = mediaUrl(e.mapImage);
        group.meta = e.mapMeta;
      }
      group.photo = e.venuePhoto ? mediaUrl(e.venuePhoto) : group.photo;
      group.maps = e.maps || group.maps;
      continue;
    }
    maps.push({
      id: e.key,
      label: e.key === "akad" ? "Akad" : "Resepsi",
      src: e.mapImage ? mediaUrl(e.mapImage) : "",
      meta: e.mapMeta,
      venue: e.location,
      address: e.address,
      maps: e.maps,
      photo: e.venuePhoto ? mediaUrl(e.venuePhoto) : "",
      events: [e.key],
    });
  }
  // a venue without an uploaded map has nothing to show
  const venueMaps = maps.filter((m) => m.src);

  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const mapRef = useRef<HTMLElement>(null);

  const showMap = (key: EventInfo["key"]) => {
    const i = venueMaps.findIndex((m) => m.events.includes(key));
    if (i < 0) return;
    setActive(i);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // let the scroll land before the map unfolds
    setTimeout(() => setRevealed(true), 450);
  };

  // one shared day goes in the header; differing days move onto each ticket
  const dates = [...new Set(events.map((e) => e.date).filter(Boolean))];
  const sameDay = dates.length <= 1;
  const day = (sameDay && dates[0] && parseLooseDate(dates[0])) || parseDate(settings.wedding_date);
  const weekday = day && new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(day);
  const dayLabel = sameDay && dates[0] ? dates[0] : formatLongDate(settings.wedding_date);

  return (
    <div className="space-y-5" style={{ color: INK }}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {weekday && sameDay && <p className="font-eyebrow text-[10px] uppercase opacity-60">{weekday}</p>}
          <p className="font-heading text-[28px] leading-tight">{dayLabel}</p>
          <p className="font-script text-xl leading-tight opacity-75">
            {!sameDay ? "dua hari, dua momen" : events.length > 1 ? "satu hari, dua momen" : "satu hari bahagia"}
          </p>
        </div>
        <Illustration name="dinner" className="h-20 w-auto flex-none sm:h-24" />
      </div>

      <div>
        {events.map((event, i) => (
          <div key={event.key}>
            {i > 0 && (
              <div aria-hidden className="flex h-8 items-center" style={{ paddingLeft: 41 }}>
                <span className="h-full border-l-2 border-dashed" style={{ borderColor: `${INK}66` }} />
                <span className="font-script ml-3 text-lg opacity-60">lalu…</span>
              </div>
            )}
            <EventTicket
              event={event}
              showDate={!sameDay}
              index={i}
              onShowMap={venueMaps.some((m) => m.events.includes(event.key)) ? () => showMap(event.key) : undefined}
            />
          </div>
        ))}
      </div>

      {venueMaps.length > 0 && (
        <MapSection
          maps={venueMaps}
          active={Math.min(active, venueMaps.length - 1)}
          onSelect={(i) => {
            setActive(i);
            setRevealed(false);
          }}
          revealed={revealed}
          onToggle={() => setRevealed((r) => !r)}
          sectionRef={mapRef}
        />
      )}

      <div
        className="mx-1 flex rotate-[-1.2deg] items-center gap-3 rounded-[10px] crayon-box wc px-3 py-2.5"
        style={{
          backgroundColor: TONES.butter.bg,
          color: TONES.butter.ink,
          boxShadow: `3px 3px 0 0 ${TONES.butter.edge}`,
        }}
      >
        <ClockFace className="h-9 w-9 flex-none" delay={0.35} />
        <p className="font-script text-xl leading-snug">
          Mohon hadir sedikit lebih awal agar tidak melewatkan momen pentingnya.
        </p>
      </div>
    </div>
  );
}
