"use client";

import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import type { Settings } from "@/lib/types";
import Ornament from "./Ornament";

function Person({
  role,
  image,
  name,
  parents,
  instagram,
  fromLeft,
}: {
  role: string;
  image: string;
  name: string;
  parents: string;
  instagram: string;
  fromLeft: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: fromLeft ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="flex flex-col items-center"
    >
      <div className="gilt-frame mx-auto w-44 overflow-hidden rounded-[140px_140px_0_0] sm:w-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={role}
          className="aspect-[3/4] w-full rounded-[135px_135px_0_0] object-cover"
        />
      </div>
      <p className="font-label mt-6 text-[10px] text-accent/80">{role}</p>
      <h3 className="mt-2 font-vibes text-4xl text-primary">{name}</h3>
      {parents && (
        <p className="mt-3 max-w-xs font-serif text-lg leading-snug text-primary/75">
          {parents}
        </p>
      )}
      {instagram && (
        <a
          href={`https://instagram.com/${instagram.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent transition-colors hover:text-primary"
        >
          <Instagram className="h-3.5 w-3.5" />@{instagram.replace("@", "")}
        </a>
      )}
    </motion.div>
  );
}

export default function CoupleSection({ settings }: { settings: Settings }) {
  return (
    <section className="relative overflow-hidden px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        {/* opening greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="font-serif text-2xl italic text-gold sm:text-3xl">
            Bismillahirrahmanirrahim
          </p>
          <p className="mt-4 font-label text-[11px] text-accent/80">
            Assalamu&rsquo;alaikum Warahmatullahi Wabarakatuh
          </p>
          <p className="mx-auto mt-5 max-w-xl font-serif text-lg leading-relaxed text-primary/80 sm:text-xl">
            Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud
            menyelenggarakan pernikahan putra-putri kami.
          </p>
        </motion.div>

        {settings.quote && (
          <motion.figure
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mx-auto mt-10 max-w-xl"
          >
            <Ornament width={140} />
            <blockquote className="mt-5 font-serif text-xl italic leading-relaxed text-primary/85 sm:text-2xl">
              &ldquo;{settings.quote}&rdquo;
            </blockquote>
            {settings.quote_author && (
              <figcaption className="mt-3 font-label text-[10px] text-primary/50">
                {settings.quote_author}
              </figcaption>
            )}
          </motion.figure>
        )}

        {settings.couple_image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mx-auto mt-12 w-full max-w-xl"
          >
            <div className="gilt-frame overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(settings.couple_image)}
                alt="Couple"
                className="h-auto w-full object-cover"
              />
            </div>
          </motion.div>
        )}

        <p className="mt-16 font-label text-[11px] text-accent/80">Mempelai</p>
        <div className="mt-8 grid items-start gap-10 sm:grid-cols-[1fr_auto_1fr]">
          <Person
            role="Mempelai Pria"
            image="/images/groom.jpg"
            name={settings.groom_full_name || settings.groom_name}
            parents={settings.groom_parents}
            instagram={settings.groom_instagram}
            fromLeft
          />
          <div className="hidden items-center justify-center sm:flex">
            <span className="font-vibes text-5xl text-gold">&amp;</span>
          </div>
          <Person
            role="Mempelai Wanita"
            image="/images/bride.jpg"
            name={settings.bride_full_name || settings.bride_name}
            parents={settings.bride_parents}
            instagram={settings.bride_instagram}
            fromLeft={false}
          />
        </div>
      </div>
    </section>
  );
}
