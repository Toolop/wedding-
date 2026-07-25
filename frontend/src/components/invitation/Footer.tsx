"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { Settings } from "@/lib/types";
import Ornament from "./Ornament";

export default function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="relative px-6 pb-16 pt-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p className="font-label text-[11px] text-accent/80">Wassalamu&rsquo;alaikum Wr. Wb.</p>
        <p className="mt-5 font-vibes text-5xl text-primary">
          {settings.groom_name} &amp; {settings.bride_name}
        </p>
        <Ornament className="mt-5" width={180} />
        <p className="mx-auto mt-5 max-w-md font-serif text-lg leading-relaxed text-primary/70">
          Terima kasih atas doa dan restu yang diberikan. Kehadiran serta dukungan
          Anda merupakan suatu kebahagiaan dan kehormatan besar bagi kami.
        </p>
        <div className="mt-8 flex items-center justify-center gap-1.5 font-label text-[9px] text-primary/40">
          Made with <Heart className="h-3 w-3 fill-gold text-gold" /> for our special day
        </div>
      </motion.div>
    </footer>
  );
}
