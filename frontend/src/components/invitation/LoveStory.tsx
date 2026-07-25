"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles, Gem, Church, Star, type LucideIcon } from "lucide-react";
import type { StoryEvent } from "@/lib/types";
import SectionHeading from "./SectionHeading";

const ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  sparkles: Sparkles,
  gem: Gem,
  church: Church,
  star: Star,
};

export default function LoveStory({ story }: { story: StoryEvent[] }) {
  if (story.length === 0) return null;

  return (
    <section className="bg-secondary/40 px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <SectionHeading label="Perjalanan Kami" title="Kisah Cinta" />

        <div className="relative mt-16">
          <div className="absolute left-5 top-0 h-full w-px bg-gold/40 sm:left-1/2" />

          <div className="space-y-12">
            {story.map((item, i) => {
              const Icon = ICONS[item.icon] || Heart;
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.7 }}
                  className={`relative flex items-start gap-5 sm:w-1/2 ${
                    isLeft
                      ? "sm:pr-12 sm:text-right"
                      : "sm:ml-auto sm:flex-row-reverse sm:pl-12 sm:text-left"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 flex-none items-center justify-center rounded-full border border-gold/50 bg-surface text-accent shadow-sm sm:absolute sm:top-0 ${
                      isLeft ? "sm:-right-[22px]" : "sm:-left-[22px]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-label text-[10px] text-accent/80">
                      {item.event_date}
                    </span>
                    <h3 className="mt-1.5 font-serif text-2xl font-semibold text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-primary/70">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
