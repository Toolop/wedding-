/**
 * Watercolour-comic palette, sampled from the couple illustrations:
 * warm white paper, soft crayon ink, navy polos, cream hijab, blush cheeks,
 * batik teal, honey highlights.
 */
export const PAGE = "#FAF5EC";
export const PAPER = "#FFFDF8";
export const CHROME = "#F5E9D7";
export const INK = "#2B2522";
export const NAVY = "#3E4A6B";
export const RED = "#D2574A";
export const BLUSH = "#E9A195";
export const HONEY = "#F2C66D";
export const TEAL = "#5FA39A";
export const DENIM = "#6F8FBF";

/**
 * Sticker tones for the portal cards (keys kept from the original layout).
 * `edge` is the soft paint shadow; outlines are always crayon ink.
 */
export const TONES = {
  mauve: { bg: "#F7D9D2", edge: "#E9B5AA", ink: INK },
  cream: { bg: "#F6EAD6", edge: "#E0CBA9", ink: INK },
  sky: { bg: "#DCE5F2", edge: "#B5C5DE", ink: INK },
  teal: { bg: "#D3E8E4", edge: "#A7CBC4", ink: INK },
  coral: { bg: "#F8DEC4", edge: "#E8BF97", ink: INK },
  magenta: { bg: NAVY, edge: "#27304A", ink: "#FFF7EC" },
  butter: { bg: "#F8DC96", edge: "#E6BD5C", ink: INK },
} as const;

export type ToneKey = keyof typeof TONES;

/** the four couple illustrations, served from /public */
export const ILLUSTRATIONS = {
  cafe: { src: "/images/illustrations/cafe.jpeg", alt: "Berdua di kafe dengan kaus navy yang kembar" },
  hello: { src: "/images/illustrations/hello.jpeg", alt: "Berdua melambaikan tanda peace" },
  dinner: { src: "/images/illustrations/dinner.jpeg", alt: "Makan malam berdua sambil bersandar" },
  champions: { src: "/images/illustrations/champions.jpeg", alt: "Berdua mengangkat piala juara satu" },
} as const;

export type IllustrationKey = keyof typeof ILLUSTRATIONS;
