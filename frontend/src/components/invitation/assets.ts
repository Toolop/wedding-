/**
 * Every image path used by the app, in one place. Components import `IMG`
 * instead of writing "/images/..." literals, so a rename or a changed
 * extension is a one-line fix (the files live in /public/images).
 */
const ill = (file: string) => `/images/illustrations/${file}`;
const flower = (file: string) => `/images/flowers/${file}`;

export const IMG = {
  // couple
  cafe: ill("cafe.jpeg"),
  hello: ill("hello.jpeg"),
  dinner: ill("dinner.jpeg"),
  champions: ill("champions.jpeg"),
  wedding: ill("wedding.jpg"),
  // people
  rafi: ill("rafi.png"),
  rafiHand: ill("rafi-hand.png"),
  tiara: ill("tiara.png"),
  tiaraHand: ill("tiara-hand.png"),
  // chapters
  comifuro: ill("comifuro.jpg"),
  kereta: ill("kereta.png"),
  pestaBuku: ill("pesta-buku.jpg"),
  lookback: ill("lookback.jpg"),
  gbk: ill("gbk.jpg"),
  gbkBed: ill("gbk-bed.jpg"),
  gbkSplit: ill("gbk-split.jpg"),
  gbkLaugh: ill("gbk-laugh.jpg"),
  ig1: ill("ig-1.jpg"),
  ig2: ill("ig-2.jpg"),
  ig3: ill("ig-3.jpg"),
  lunch1: ill("lunch-1.jpg"),
  lunch2: ill("lunch-2.jpg"),
  lunch3: ill("lunch-3.jpg"),
  lunch4: ill("lunch-4.jpg"),
  lunch5: ill("lunch-5.jpg"),
  tj1: ill("tj-1.jpg"),
  tj2: ill("tj-2.jpg"),
  tj3: ill("tj-3.jpg"),
  tj4: ill("tj-4.jpg"),
  sucofindo: ill("sucofindo.jpg"),
  sucofindoPhoto: ill("sucofindo-photo.jpg"),
  // flowers
  gypsophilaSpray: flower("gypsophila-spray.svg"),
  gypsophilaSprig: flower("gypsophila-sprig.svg"),
  leafSpray: flower("leaf-spray.svg"),
} as const;

/** the couple illustrations with their alt text */
export const ILLUSTRATIONS = {
  cafe: { src: IMG.cafe, alt: "Berdua di kafe dengan kaus navy yang kembar" },
  hello: { src: IMG.hello, alt: "Berdua melambaikan tanda peace" },
  dinner: { src: IMG.dinner, alt: "Makan malam berdua sambil bersandar" },
  champions: { src: IMG.champions, alt: "Berdua mengangkat piala juara satu" },
  wedding: { src: IMG.wedding, alt: "Berdua di pelaminan, dengan gaun pengantin dan jas hitam" },
} as const;

export type IllustrationKey = keyof typeof ILLUSTRATIONS;
