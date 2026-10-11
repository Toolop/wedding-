"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import type { InvitationData } from "@/lib/types";
import PetalRain from "./PetalRain";
import ThemeProvider from "./ThemeProvider";
import ComicIntro from "./invitation/ComicIntro";
import OpeningScreen from "./invitation/OpeningScreen";
import Hero from "./invitation/Hero";
import MusicToggle from "./invitation/MusicToggle";
import { WatercolorDefs } from "./invitation/WatercolorArt";

type Stage = "comic" | "envelope" | "opened";

export default function InvitationClient({ data }: { data: InvitationData }) {
  const [stage, setStage] = useState<Stage>("comic");
  const { settings } = data;

  // the invitation is a single screen: every section opens as a pop-up,
  // so the page itself never scrolls
  useEffect(() => {
    const html = document.documentElement.style;
    const body = document.body.style;
    const prev = [html.overflow, body.overflow, body.overscrollBehavior];
    html.overflow = "hidden";
    body.overflow = "hidden";
    body.overscrollBehavior = "none";
    return () => {
      [html.overflow, body.overflow, body.overscrollBehavior] = prev;
    };
  }, []);

  return (
    <ThemeProvider settings={settings}>
      <WatercolorDefs />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#FFFDF8",
            color: "#2B2522",
            border: "2px dashed #2B2522",
            borderRadius: "999px",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 600,
          },
          iconTheme: { primary: "#D2574A", secondary: "#FFFDF8" },
        }}
      />
      <PetalRain />
      <AnimatePresence mode="wait">
        {stage === "comic" && (
          <ComicIntro
            key="comic"
            settings={settings}
            story={data.story}
            onFinish={() => setStage("envelope")}
          />
        )}
        {stage === "envelope" && (
          <OpeningScreen
            key="envelope"
            settings={settings}
            onOpen={() => setStage("opened")}
          />
        )}
      </AnimatePresence>

      {stage === "opened" && <MusicToggle musicUrl={settings.music_url} autoStart />}

      <Hero data={data} />
    </ThemeProvider>
  );
}
