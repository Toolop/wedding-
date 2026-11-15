import type { ReactNode } from "react";
import { IMG } from "./assets";

/*
 * Shared "classic" pieces: double-line frames, gold ornaments, botanical corners.
 * No hex here: colours come from the @theme tokens in globals.css.
 */

type Tone = "light" | "brand" | "blush";

/** a card inside a card: a pale outer line and a gold hairline inside, like letterpress stationery */
export function DoubleFrame({
  tone = "light",
  className = "",
  innerClassName = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  const outer = tone === "brand" ? "bg-brand text-on-brand" : "border border-line bg-paper";
  const inner =
    tone === "brand"
      ? "border border-honey/70"
      : tone === "blush"
        ? "border border-gold-soft bg-blush-soft"
        : "border border-gold-soft bg-page";
  return (
    <div className={`rounded-[6px] p-[7px] ${outer} ${className}`}>
      <div className={`h-full rounded-[3px] ${inner} ${innerClassName}`}>{children}</div>
    </div>
  );
}

/** hairline – small diamond – hairline */
export function Ornament({ onBrand = false, className = "" }: { onBrand?: boolean; className?: string }) {
  const c = onBrand ? "bg-honey" : "bg-gold";
  return (
    <span aria-hidden className={`flex items-center justify-center gap-1.5 ${className}`}>
      <span className={`h-px w-[22px] ${c}`} />
      <svg width="8" height="8" viewBox="0 0 8 8" className={onBrand ? "fill-honey" : "fill-gold"}>
        <path d="M4 0l4 4-4 4-4-4z" />
      </svg>
      <span className={`h-px w-[22px] ${c}`} />
    </span>
  );
}

/** small letter-spaced label; `rule` draws a gold stub before it and a hairline after */
export function Eyebrow({
  children,
  rule = false,
  onBrand = false,
  className = "",
}: {
  children: ReactNode;
  rule?: boolean;
  onBrand?: boolean;
  className?: string;
}) {
  return (
    <p className={`font-eyebrow flex items-center gap-3 text-[11px] uppercase ${onBrand ? "text-honey" : "text-gold-ink"} ${className}`}>
      {rule && <span aria-hidden className="h-px w-8 bg-gold" />}
      {children}
      {rule && <span aria-hidden className="h-px flex-1 bg-line" />}
    </p>
  );
}

/** "DETAIL →": uppercase label with a thin arrow */
export function ArrowLink({
  children,
  onBrand = false,
  className = "",
}: {
  children: ReactNode;
  onBrand?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex min-h-11 items-center gap-1.5 font-code text-xs font-semibold uppercase tracking-[0.12em] ${
        onBrand ? "text-on-brand" : "text-ink"
      } ${className}`}
    >
      {children}
      <svg aria-hidden width="18" height="10" viewBox="0 0 18 10" fill="none" strokeWidth="1.5" strokeLinecap="round" className={onBrand ? "stroke-honey" : "stroke-brand"}>
        <path d="M1 5h15M12 1l4 4-4 4" />
      </svg>
    </span>
  );
}

/** the couple's emblem (their names in a floral ring); `a`/`b` are their initials, for the alt text */
export function Monogram({ a, b, size = 56, className = "" }: { a: string; b: string; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={IMG.logo}
      alt={`${a} & ${b}`}
      width={size}
      height={size}
      draggable={false}
      className={`inline-block flex-none select-none object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

const LEAVES = [
  "M10 10C70 40 120 90 160 200",
  "M48 32c-6-18 4-30 20-34-2 18-8 28-20 34z",
  "M78 56c14-14 30-12 40-2-16 8-28 8-40 2z",
  "M96 84c-10-18-2-34 14-40 2 18-4 30-14 40z",
  "M118 116c16-10 32-6 40 6-18 4-30 2-40-6z",
  "M132 146c-12-16-8-32 6-40 4 18 0 30-6 40z",
];

/** a line-drawn sprig for a corner of the page */
export function BotanicalCorner({ tone = "sage", className = "" }: { tone?: "sage" | "rose"; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 260 220"
      fill="none"
      strokeWidth="1.1"
      strokeLinecap="round"
      className={`pointer-events-none absolute ${tone === "rose" ? "stroke-blush" : "stroke-mint"} ${className}`}
    >
      {LEAVES.map((d) => (
        <path key={d} d={d} />
      ))}
      <circle cx="36" cy="58" r="3" />
      <circle cx="58" cy="90" r="2.5" />
      <circle cx="150" cy="80" r="3" />
    </svg>
  );
}

/** the two sprigs that frame a full page: sage top-left, rose bottom-right */
export function BotanicalFrame() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <BotanicalCorner className="-left-8 -top-8 h-[220px] w-[260px] opacity-85 sm:h-[270px] sm:w-[320px]" />
      <BotanicalCorner tone="rose" className="-bottom-10 -right-8 h-[220px] w-[260px] rotate-180 opacity-85 sm:h-[270px] sm:w-[320px]" />
    </div>
  );
}

/** a photo with gold corner mounts, like a print in an album */
export function PhotoCorners({ children, className = "" }: { children: ReactNode; className?: string }) {
  const tri = "absolute h-3.5 w-3.5 fill-gold";
  return (
    <span className={`relative inline-block bg-paper p-[5px] shadow-paint-sm ${className}`}>
      <svg aria-hidden viewBox="0 0 14 14" className={`${tri} -left-[3px] -top-[3px]`}><path d="M0 0h14L0 14z" /></svg>
      <svg aria-hidden viewBox="0 0 14 14" className={`${tri} -right-[3px] -top-[3px]`}><path d="M0 0h14v14z" /></svg>
      <svg aria-hidden viewBox="0 0 14 14" className={`${tri} -bottom-[3px] -left-[3px]`}><path d="M0 0v14h14z" /></svg>
      <svg aria-hidden viewBox="0 0 14 14" className={`${tri} -bottom-[3px] -right-[3px]`}><path d="M14 0v14H0z" /></svg>
      {children}
    </span>
  );
}
