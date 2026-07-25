"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import type { Settings } from "@/lib/types";
import {
  ArrowDown,
  Brackets,
  ChartBars,
  Coffee,
  CrayonDefs,
  DoodleField,
  DrawnFrame,
  Float,
  Heart,
  Sparkle,
  Squiggle,
} from "./CrayonDoodles";

type Panel =
  | { key: string; variant: "cover"; eyebrow: string; title: string; subtitle: string }
  | {
      key: string;
      variant: "image";
      theme: "code" | "data" | "love";
      accent: "brackets" | "chart" | "heart";
      eyebrow: string;
      image: string;
      aspect: string;
      caption: string;
    }
  | { key: string; variant: "bloom"; eyebrow: string; caption: string }
  | { key: string; variant: "final"; eyebrow: string; caption: string };

function buildPanels(settings: Settings): Panel[] {
  const groom = settings.groom_name || "Dia";
  const bride = settings.bride_name || "Dia";
  return [
    {
      key: "cover",
      variant: "cover",
      eyebrow: "// chapter 01",
      title: "Sebuah Kisah\nKode & Cinta",
      subtitle: `${groom} & ${bride}`,
    },
    {
      key: "groom",
      variant: "image",
      theme: "code",
      accent: "brackets",
      eyebrow: "// chapter 02",
      image: "/images/groom.jpg",
      aspect: "aspect-[3/4] w-56 sm:w-64",
      caption: `Di baris kode yang sunyi, ${groom} sedang membangun sesuatu — tanpa tahu bahwa hal terbaik yang akan ia bangun bukanlah sebuah program.`,
    },
    {
      key: "bride",
      variant: "image",
      theme: "data",
      accent: "chart",
      eyebrow: "// chapter 03",
      image: "/images/bride.jpg",
      aspect: "aspect-[3/4] w-56 sm:w-64",
      caption: `Di sisi lain layar, ${bride} membaca pola dalam data — dan diam-diam menemukan satu pola yang tak bisa dijelaskan angka.`,
    },
    {
      key: "together",
      variant: "image",
      theme: "love",
      accent: "heart",
      eyebrow: "// chapter 04",
      image: "/images/couple.jpg",
      aspect: "aspect-video w-full max-w-md",
      caption: "Lalu, entah bagaimana, semesta men-compile mereka menjadi satu tim.",
    },
    {
      key: "bloom",
      variant: "bloom",
      eyebrow: "// chapter 05",
      caption:
        "Bug jadi cerita lucu, deadline jadi kenangan, dan cinta tumbuh diam-diam di antara commit dan cangkir kopi yang tak pernah habis.",
    },
    {
      key: "final",
      variant: "final",
      eyebrow: "// chapter 06",
      caption: "Sampai tiba waktunya untuk merilis versi terbaru dari kisah mereka —",
    },
  ];
}

/** Reveal a caption line-by-line for a hand-written, storybook cadence. */
function StoryCaption({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <motion.p
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      transition={{ staggerChildren: 0.045, delayChildren: delay }}
      className="max-w-sm font-script text-2xl leading-snug text-primary/90 sm:text-3xl"
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="inline-block"
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </motion.p>
  );
}

function AccentDoodle({
  accent,
}: {
  accent: "brackets" | "chart" | "heart";
}) {
  if (accent === "brackets") return <Brackets size={44} className="text-accent" />;
  if (accent === "chart") return <ChartBars size={38} className="text-accent" />;
  return <Heart size={34} className="text-accent" />;
}

function CoverPanel({ panel }: { panel: Extract<Panel, { variant: "cover" }> }) {
  return (
    <div className="relative flex h-screen w-full snap-start flex-col items-center justify-center overflow-hidden px-6 text-center">
      <DoodleField kind="love" />
      <Float className="absolute left-[16%] top-[22%]" dur={5}>
        <Brackets size={40} className="text-accent/60" />
      </Float>
      <Float className="absolute right-[18%] top-[26%]" dur={4.4} delay={0.6}>
        <Coffee size={30} className="text-primary/40" />
      </Float>

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="font-eyebrow text-xs text-primary/60"
      >
        {panel.eyebrow}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.9 }}
        className="mt-4 whitespace-pre-line font-script text-5xl leading-tight text-primary sm:text-6xl"
      >
        {panel.title}
      </motion.h1>
      <div className="mt-3 text-accent">
        <Squiggle width={180} delay={1.1} />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-4 font-heading text-xl text-accent"
      >
        {panel.subtitle}
      </motion.p>

      <Float
        className="absolute bottom-14 text-primary/50"
        dist={6}
        rotate={0}
        dur={1.8}
      >
        <ArrowDown size={26} delay={1.4} />
      </Float>
    </div>
  );
}

function ImagePanel({
  panel,
  containerRef,
}: {
  panel: Extract<Panel, { variant: "image" }>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    container: containerRef,
    offset: ["start end", "end start"],
  });
  // layered parallax: image drifts one way, caption the other → depth
  const imgY = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const capY = useTransform(scrollYProgress, [0, 1], [-30, 30]);
  const accentY = useTransform(scrollYProgress, [0, 1], [120, -120]);

  return (
    <div
      ref={ref}
      className="relative flex h-screen w-full snap-start flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center"
    >
      <DoodleField kind={panel.theme} />

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.6 }}
        className="font-eyebrow z-10 text-xs text-primary/60"
      >
        {panel.eyebrow}
      </motion.p>

      <motion.div style={{ y: imgY }} className="relative z-10">
        {/* a floating accent doodle that parallaxes fastest, pinned to the frame */}
        <motion.div
          style={{ y: accentY }}
          className="absolute -right-6 -top-6 z-20 sm:-right-8"
        >
          <Float dur={4} dist={8}>
            <AccentDoodle accent={panel.accent} />
          </Float>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -1.5 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: "backOut" }}
          className={`relative ${panel.aspect}`}
        >
          <motion.div
            animate={{ scale: [1, 1.015, 1], rotate: [-0.4, 0.4, -0.4] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="sketch-border h-full w-full overflow-hidden text-primary/70 shadow-lg"
            style={{ filter: "url(#crayon-soft)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={panel.image} alt="" className="h-full w-full object-cover" />
          </motion.div>
          <DrawnFrame delay={0.3} />
        </motion.div>
      </motion.div>

      <motion.div style={{ y: capY }} className="z-10">
        <StoryCaption text={panel.caption} delay={0.35} />
      </motion.div>
    </div>
  );
}

function BloomPanel({ panel }: { panel: Extract<Panel, { variant: "bloom" }> }) {
  return (
    <div className="relative flex h-screen w-full snap-start flex-col items-center justify-center gap-10 overflow-hidden px-6 text-center">
      <DoodleField kind="love" />
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.6 }}
        className="font-eyebrow z-10 text-xs text-primary/60"
      >
        {panel.eyebrow}
      </motion.p>
      <div className="z-10">
        <StoryCaption text={panel.caption} delay={0.4} />
      </div>
    </div>
  );
}

function FinalPanel({
  panel,
  onFinish,
}: {
  panel: Extract<Panel, { variant: "final" }>;
  onFinish: () => void;
}) {
  return (
    <div className="relative flex h-screen w-full snap-start flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center">
      <DoodleField kind="love" />
      <Float className="absolute left-[20%] top-[24%]" dur={4.6}>
        <Heart size={30} className="text-accent/60" />
      </Float>
      <Float className="absolute right-[22%] top-[30%]" dur={5.2} delay={0.5}>
        <Sparkle size={24} className="text-primary/40" />
      </Float>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.6 }}
        className="font-eyebrow z-10 text-xs text-primary/60"
      >
        {panel.eyebrow}
      </motion.p>
      <div className="z-10">
        <StoryCaption text={panel.caption} delay={0.15} />
      </div>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        onClick={onFinish}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="sketch-border z-10 inline-flex items-center gap-2 bg-primary px-8 py-3.5 font-code text-sm font-medium tracking-wide text-surface shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/35"
      >
        <Mail className="h-4 w-4" />
        Buka Amplop
      </motion.button>
    </div>
  );
}

export default function ComicIntro({
  settings,
  onFinish,
}: {
  settings: Settings;
  onFinish: () => void;
}) {
  const panels = buildPanels(settings);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- scroll-position derived UI, must react to user input
      setShowHint(el.scrollTop < 40);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 bg-surface"
    >
      <CrayonDefs />

      <button
        onClick={onFinish}
        className="font-code fixed right-5 top-5 z-20 rounded-full border border-primary/20 bg-surface/80 px-4 py-1.5 text-xs text-primary/70 backdrop-blur-sm transition-colors hover:text-primary"
      >
        Lewati
      </button>

      <div
        ref={containerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {panels.map((panel) => {
          switch (panel.variant) {
            case "cover":
              return <CoverPanel key={panel.key} panel={panel} />;
            case "image":
              return (
                <ImagePanel key={panel.key} panel={panel} containerRef={containerRef} />
              );
            case "bloom":
              return <BloomPanel key={panel.key} panel={panel} />;
            case "final":
              return <FinalPanel key={panel.key} panel={panel} onFinish={onFinish} />;
          }
        })}
      </div>
    </motion.div>
  );
}
