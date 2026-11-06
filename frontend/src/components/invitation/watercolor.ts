/**
 * Sage & mint palette: soft mint paper, baby's-breath white, sage and
 * olive stickers, deep forest green for the strong buttons, a dusty rose
 * for hearts and the circled date.
 */
export const PAGE = "#F2F6EF";
export const PAPER = "#FCFDF9";
export const CHROME = "#E4EEDF";
export const INK = "#2F3D35";
export const NAVY = "#3F6B57";
export const RED = "#C2676A";
export const BLUSH = "#E9A9A1";
export const HONEY = "#E6CF8A";
export const TEAL = "#7FA98F";
export const DENIM = "#9CC9AE";

/**
 * Sticker tones for the portal cards (keys kept from the original layout).
 * `edge` is the soft paint shadow; outlines are always crayon ink.
 */
export const TONES = {
  mauve: { bg: "#E6EDD8", edge: "#C3D0AE", ink: INK },
  cream: { bg: "#D9E6CC", edge: "#B4C9A3", ink: INK },
  sky: { bg: "#D4E8DA", edge: "#AACAB4", ink: INK },
  teal: { bg: "#C8E1D4", edge: "#9FC4B1", ink: INK },
  coral: { bg: "#BFD3B5", edge: "#96AF8C", ink: INK },
  magenta: { bg: NAVY, edge: "#2A4A3C", ink: "#F6FAF2" },
  butter: { bg: "#EEF0CF", edge: "#D3D7A6", ink: INK },
  olive: { bg: "#6F8A55", edge: "#4F663B", ink: "#F6FAF2" },
  // the one warm sticker: "berhalangan" on the RSVP
  rose: { bg: "#EEAAA3", edge: RED, ink: INK },
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
