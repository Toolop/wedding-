"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import type { Settings } from "@/lib/types";
import SectionHeading from "./SectionHeading";
import Ornament from "./Ornament";

function EventCard({
  title,
  date,
  time,
  location,
  address,
  mapsUrl,
  delay,
}: {
  title: string;
  date: string;
  time: string;
  location: string;
  address: string;
  mapsUrl: string;
  delay: number;
}) {
  if (!date && !time && !location) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
      className="frame-elegant relative flex-1 rounded-sm bg-surface/70 p-8 text-center backdrop-blur-md"
    >
      <h3 className="font-vibes text-4xl text-primary">{title}</h3>
      <Ornament className="mt-3" width={120} />

      <div className="mt-6 space-y-3.5 text-sm text-primary/80">
        {date && (
          <div className="flex items-center justify-center gap-2.5">
            <Calendar className="h-4 w-4 text-gold" />
            <span className="font-serif text-lg">{date}</span>
          </div>
        )}
        {time && (
          <div className="flex items-center justify-center gap-2.5">
            <Clock className="h-4 w-4 text-gold" />
            <span className="font-serif text-lg">{time}</span>
          </div>
        )}
        {location && (
          <div className="flex items-start justify-center gap-2.5 text-left">
            <MapPin className="mt-0.5 h-4 w-4 flex-none text-gold" />
            <span>
              <span className="font-medium">{location}</span>
              {address && <span className="block text-primary/60">{address}</span>}
            </span>
          </div>
        )}
      </div>

      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-1.5 border border-accent/40 px-6 py-2.5 font-label text-[10px] text-accent transition-colors hover:bg-accent hover:text-white"
        >
          Lihat Lokasi <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </motion.div>
  );
}

export default function EventDetails({ settings }: { settings: Settings }) {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading label="Save The Date" title="Waktu & Tempat" />

        <div className="mt-14 flex flex-col gap-8 sm:flex-row">
          <EventCard
            title="Akad Nikah"
            date={settings.akad_date}
            time={settings.akad_time}
            location={settings.akad_location}
            address={settings.akad_address}
            mapsUrl={settings.akad_maps_url}
            delay={0}
          />
          <EventCard
            title="Resepsi"
            date={settings.resepsi_date}
            time={settings.resepsi_time}
            location={settings.resepsi_location}
            address={settings.resepsi_address}
            mapsUrl={settings.resepsi_maps_url}
            delay={0.15}
          />
        </div>
      </div>
    </section>
  );
}
