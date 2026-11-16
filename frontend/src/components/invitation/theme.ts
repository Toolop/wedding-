/**
 * Invitation palette for inline styles / SVG props.
 *
 * The values live in ONE place: the `@theme` block of src/app/globals.css.
 * This file only exposes them as `var(--color-*)` references, so there is no
 * second copy of any hex. In class names use the Tailwind utilities
 * (`text-ink`, `bg-paper`, `border-brand/40`).
 */
export const colors = {
  ink: "var(--color-ink)",
  inkDeep: "var(--color-ink-deep)",
  page: "var(--color-page)",
  paper: "var(--color-paper)",
  chrome: "var(--color-chrome)",
  brand: "var(--color-brand)",
  brandDeep: "var(--color-brand-deep)",
  brandInk: "var(--color-brand-ink)",
  onBrand: "var(--color-on-brand)",
  heart: "var(--color-heart)",
  blush: "var(--color-blush)",
  blushSoft: "var(--color-blush-soft)",
  honey: "var(--color-honey)",
  mint: "var(--color-mint)",
  mistSoft: "var(--color-mist-soft)",
  danger: "var(--color-danger)",
  gold: "var(--color-gold)",
  goldInk: "var(--color-gold-ink)",
  goldSoft: "var(--color-gold-soft)",
  line: "var(--color-line)",
  lineSoft: "var(--color-line-soft)",
  muted: "var(--color-ink-soft)",
  onBrandMuted: "var(--color-on-brand-muted)",
} as const;

/** `c` at `pct`% opacity, e.g. alpha(colors.ink, 30) */
export const alpha = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

/**
 * Resolve a `var(--x)` reference to its computed colour. Only needed where a
 * library wants a literal colour string (canvas-confetti). Browser only.
 */
export function readColor(ref: string): string {
  const name = /^var\((--[\w-]+)\)$/.exec(ref)?.[1];
  if (!name || typeof document === "undefined") return ref;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || ref;
}

const tone = (name: string, ink: string = colors.ink) => ({
  bg: `var(--color-tone-${name})`,
  edge: `var(--color-tone-${name}-edge)`,
  ink,
});

/**
 * Sticker tones for the portal cards. `edge` is the soft paint shadow;
 * outlines are always crayon ink. Fills are defined in globals.css.
 */
export const TONES = {
  sage: tone("sage"),
  fern: tone("fern"),
  mist: tone("mist"),
  seafoam: tone("seafoam"),
  moss: tone("moss"),
  butter: tone("butter"),
  olive: tone("olive", colors.onBrand),
  // the strong one: forest-green button fill
  brand: { bg: colors.brand, edge: colors.brandDeep, ink: colors.onBrand },
  // the one warm sticker: "berhalangan" on the RSVP
  rose: tone("rose"),
} as const;

export type ToneKey = keyof typeof TONES;
