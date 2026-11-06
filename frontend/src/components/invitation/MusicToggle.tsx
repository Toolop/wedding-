"use client";

import { motion } from "framer-motion";
import { Music2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/api";
import { onMusicDuck } from "./musicDuck";

const VOLUME = 0.5;
/** how far the song dips while a story moment has the floor */
const DUCKED = 0.08;

export default function MusicToggle({
  musicUrl,
  start,
}: {
  musicUrl: string;
  start: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  // dip quickly when asked, then ease back in
  useEffect(() => {
    let frame = 0;
    const off = onMusicDuck((ducked) => {
      const audio = audioRef.current;
      if (!audio) return;
      cancelAnimationFrame(frame);
      const from = audio.volume;
      const to = ducked ? DUCKED : VOLUME;
      const ms = ducked ? 250 : 1400;
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        // note: iOS Safari ignores media volume, so there the song simply keeps playing
        audio.volume = from + (to - from) * k;
        if (k < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    });
    return () => {
      off();
      cancelAnimationFrame(frame);
    };
  }, []);

  // `start` flips on from a tap (the guest opening their eyes), so the browser allows sound
  useEffect(() => {
    const audio = audioRef.current;
    if (!start || !audio || !musicUrl) return;
    audio.volume = VOLUME;
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [start, musicUrl]);

  if (!musicUrl) return null;

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  };

  return (
    <>
      <audio ref={audioRef} src={mediaUrl(musicUrl)} loop />
      {start && (
        <motion.button
          onClick={toggle}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="wc fixed left-3 top-3 z-[60] flex h-10 w-10 sm:bottom-4 sm:left-auto sm:right-4 sm:top-auto sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-dashed border-[#2F3D35] bg-[#F3DDD8] text-[#2F3D35] shadow-[3px_4px_0_0_#C3D0AE]"
          aria-label="Toggle music"
        >
          <Music2 className={`h-5 w-5 ${playing ? "animate-spin-slow" : ""}`} />
        </motion.button>
      )}
    </>
  );
}
