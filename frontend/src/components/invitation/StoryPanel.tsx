"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check, Hourglass } from "lucide-react";
import { parseDate, parseLooseDate } from "@/lib/dates";
import type { Settings, StoryEvent } from "@/lib/types";
import { colors, alpha, TONES, type ToneKey } from "./theme";
import { type IllustrationKey } from "./assets";
import { Heart, Illustration } from "./WatercolorArt";

const STORY_TONES: ToneKey[] = ["moss", "butter", "seafoam", "sage", "mist"];
const VIGNETTES: IllustrationKey[] = ["cafe", "hello", "dinner", "champions"];
const MONTH = new Intl.DateTimeFormat("id-ID", { month: "short" });
const DAY = 86_400_000;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** "6 tahun 3 bulan" between two dates, dropping zero parts */
function span(from: Date, to: Date) {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
  if (to.getDate() < from.getDate()) months -= 1;
  months = Math.max(0, months);
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (!y && !m) return "kurang dari sebulan";
  return [y && `${y} tahun`, m && `${m} bulan`].filter(Boolean).join(" ");
}

type Chapter = StoryEvent & { date: Date | null; past: boolean };

/** first meeting → wedding day, with every chapter pinned on it and "we're here" for today */
function ProgressMeter({ chapters, wedding, now }: { chapters: Chapter[]; wedding: Date | null; now: Date }) {
  const dated = (chapters.filter((c) => c.date) as (Chapter & { date: Date })[]).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const start = dated[0]?.date;
  const end = wedding ?? dated[dated.length - 1]?.date;
  if (!start || !end || end <= start) return null;

  const total = end.getTime() - start.getTime();
  const at = (d: Date) => clamp(((d.getTime() - start.getTime()) / total) * 100, 0, 100);
  const today = at(now);
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / DAY);

  return (
    <div
      className="rounded-[6px] crayon-box px-4 pb-4 pt-3"
      style={{ backgroundColor: TONES.fern.bg, }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-eyebrow eyebrow-xs">Sudah bersama</p>
          <p className="font-heading text-2xl leading-tight">{span(start, now < end ? now : end)}</p>
        </div>
        <div className="text-right">
          <p className="font-eyebrow eyebrow-xs">Menuju hari H</p>
          <p className="font-heading text-2xl leading-tight">
            {daysLeft > 0 ? `${daysLeft} hari lagi` : daysLeft === 0 ? "Hari ini!" : "Sudah resmi"}
          </p>
        </div>
      </div>

      <div className="relative mx-2 mt-9 h-3">
        {/* the whole road, dashed */}
        <span
          className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, ${alpha(colors.ink, 40)} 0 8px, transparent 8px 14px)` }}
        />
        {/* the stretch already travelled, painted */}
        <motion.span
          initial={{ width: 0 }}
          animate={{ width: `${today}%` }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          className="absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: colors.blush, boxShadow: `inset 0 -2px 0 ${TONES.sage.edge}` }}
        />
        {dated.map((c) => (
          <span
            key={c.id}
            title={c.title}
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{ left: `${at(c.date)}%`, borderColor: colors.ink, backgroundColor: c.past ? colors.ink : colors.paper }}
          />
        ))}
        <Heart className="absolute -right-3 top-1/2 h-7 w-auto -translate-y-1/2" color={colors.blush} />
        {/* "we're here" flag, kept inside the card at both ends */}
        {today < 100 && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="absolute bottom-full mb-1.5 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${clamp(today, 10, 90)}%` }}
          >
            <span className="font-script rounded-full bg-white px-2 py-0.5 text-base shadow-paint-sm">
              kita di sini
            </span>
          </motion.span>
        )}
      </div>

      <div className="mt-2 flex justify-between font-code text-[10px] opacity-60">
        <span>
          {MONTH.format(start)} {start.getFullYear()}
        </span>
        <span>
          {MONTH.format(end)} {end.getFullYear()}
        </span>
      </div>
    </div>
  );
}

function ChapterRow({ chapter, index, last }: { chapter: Chapter; index: number; last: boolean }) {
  const t = TONES[STORY_TONES[index % STORY_TONES.length]];
  const vignette = VIGNETTES[index];
  const d = chapter.date;

  return (
    <motion.li
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: "spring", stiffness: 180, damping: 20 }}
      className="relative grid grid-cols-[52px_1fr] gap-3"
    >
      {/* the dashed road down to the next chapter */}
      {!last && (
        <span
          aria-hidden
          className="absolute bottom-[-1.25rem] left-[25px] top-14 w-[2px]"
          style={{ backgroundImage: `repeating-linear-gradient(to bottom, ${alpha(colors.ink, 53)} 0 6px, transparent 6px 12px)` }}
        />
      )}

      {/* date stamp */}
      <div
        className={`relative z-[1] flex h-[52px] w-[52px] flex-col items-center justify-center rounded-full text-center ${
          chapter.past ? "crayon-box " : "border border-ink/50"
        }`}
        style={{ backgroundColor: chapter.past ? t.bg : colors.paper }}
      >
        {d ? (
          <>
            <span className="font-poster text-[13px] uppercase leading-none">{MONTH.format(d).replace(".", "")}</span>
            <span className="font-code text-[10px] leading-tight opacity-75">{d.getFullYear()}</span>
          </>
        ) : (
          <span className="font-poster text-base">{index + 1}</span>
        )}
      </div>

      <div
        className={`relative rounded-[6px] px-4 py-3 ${chapter.past ? "crayon-box " : "border border-ink/45"}`}
        style={{
          backgroundColor: chapter.past ? t.bg : "rgba(255,255,255,0.55)",
        }}
      >
        <div className={vignette ? "pr-20 sm:pr-24" : undefined}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-eyebrow eyebrow-xs">
              Bab {index + 1}
              {chapter.event_date && ` · ${chapter.event_date}`}
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-white/75 px-1.5 py-px font-code text-[9px]"
              title={chapter.past ? "Sudah terlewati" : "Segera"}
            >
              {chapter.past ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <Hourglass className="h-2.5 w-2.5" />}
              {chapter.past ? "terlewati" : "segera"}
            </span>
          </div>
          <h4 className="font-heading mt-0.5 text-2xl leading-tight">{chapter.title}</h4>
          {chapter.description && (
            <p className="mt-1 font-body text-sm leading-relaxed opacity-85">{chapter.description}</p>
          )}
        </div>
        {vignette && (
          <Illustration
            name={vignette}
            className={`absolute bottom-1 right-1 h-20 w-auto sm:h-24 ${chapter.past ? "" : "opacity-60 grayscale"}`}
          />
        )}
      </div>
    </motion.li>
  );
}

export function StoryPanel({ story, settings }: { story: StoryEvent[]; settings: Settings }) {
  // read the clock once per opening; the pop-up remounts every time it opens
  const [now] = useState(() => new Date());

  if (story.length === 0) {
    return (
      <div className="text-center" style={{ color: colors.ink }}>
        <Illustration name="dinner" className="mx-auto h-36 w-auto" />
        <p className="font-script text-2xl leading-snug opacity-80">Kisah kami masih ditulis, babnya menyusul.</p>
      </div>
    );
  }

  const chapters: Chapter[] = story.map((s) => {
    const date = s.event_date ? parseLooseDate(s.event_date) : null;
    return { ...s, date, past: date ? date <= now : true };
  });

  return (
    <div className="space-y-6" style={{ color: colors.ink }}>
      <ProgressMeter chapters={chapters} wedding={parseDate(settings.wedding_date)} now={now} />

      <ol className="space-y-5">
        {chapters.map((c, i) => (
          <ChapterRow key={c.id} chapter={c} index={i} last={i === chapters.length - 1} />
        ))}
      </ol>

      <div className="flex items-center justify-center gap-2 pb-1 opacity-75">
        <Heart className="h-6 w-auto" color={colors.blush} />
        <span className="font-script text-2xl">dan babak berikutnya, bersama.</span>
      </div>
    </div>
  );
}
