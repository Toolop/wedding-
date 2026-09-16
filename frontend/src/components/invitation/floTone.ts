/** Florence sticker tones: flat paper colours with a darker crayon edge. */
export const TONES = {
  mauve: { bg: "#E9C6CF", edge: "#B4707F", ink: "#5A2438" },
  cream: { bg: "#FBF4DC", edge: "#C9A96A", ink: "#3D3524" },
  sky: { bg: "#C7E4F6", edge: "#79ADD1", ink: "#173A55" },
  teal: { bg: "#9FD5DA", edge: "#4F9EA6", ink: "#0F4348" },
  coral: { bg: "#F7BBA6", edge: "#DC8264", ink: "#66240F" },
  magenta: { bg: "#D8206E", edge: "#95064A", ink: "#FFF1F6" },
  butter: { bg: "#FBE08A", edge: "#D6B03C", ink: "#4A3708" },
} as const;

export type ToneKey = keyof typeof TONES;

/** shared ink / paper of the portal window chrome */
export const INK = "#1F2933";
export const PAPER = "#FFF8E1";
export const CHROME = "#F6E6A8";
