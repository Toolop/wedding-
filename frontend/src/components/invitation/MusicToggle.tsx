"use client";

import { motion } from "framer-motion";
import { Music2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/api";

export default function MusicToggle({
  musicUrl,
  autoStart,
}: {
  musicUrl: string;
  autoStart: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (autoStart && audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [autoStart]);

  if (!musicUrl) return null;

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  return (
    <>
      <audio ref={audioRef} src={mediaUrl(musicUrl)} loop />
      <motion.button
        onClick={toggle}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className="wc fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-[#2B2522] bg-[#F7D9D2] text-[#2B2522] shadow-[3px_4px_0_0_#E9B5AA]"
        aria-label="Toggle music"
      >
        <Music2 className={`h-5 w-5 ${playing ? "animate-spin-slow" : ""}`} />
      </motion.button>
    </>
  );
}
