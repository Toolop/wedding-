"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import type { InvitationData } from "@/lib/types";
import { GuestProvider, type GuestAccess } from "./invitation/guest";
import PetalRain from "./PetalRain";
import ThemeProvider from "./ThemeProvider";
import ComicIntro from "./invitation/ComicIntro";
import CuteCursor from "./invitation/CuteCursor";
import OpeningScreen from "./invitation/OpeningScreen";
import Hero from "./invitation/Hero";
import MusicToggle from "./invitation/MusicToggle";
import { WatercolorDefs } from "./invitation/WatercolorArt";

type Stage = "comic" | "envelope" | "opened";

export default function InvitationClient({
  data,
  access,
}: {
  data: InvitationData;
  access: GuestAccess;
}) {
  const [current, setStage] = useState<Stage>("opened");
  const { settings } = data;
  const allowed = access.status === "ok";
  // without a valid personal link the envelope stays shut, whatever stage we start at
  const stage: Stage = allowed || current === "comic" ? current : "envelope";

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
    <GuestProvider value={allowed ? access.guest : null}>
      <ThemeProvider settings={settings}>
        <WatercolorDefs />
        <CuteCursor />
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
              blocked={allowed ? null : access.status}
              onOpen={() => allowed && setStage("opened")}
            />
          )}
        </AnimatePresence>

        {stage === "opened" && <MusicToggle musicUrl={settings.music_url} autoStart />}

        {/* without a valid link the envelope stays shut, so the invitation isn't rendered behind it */}
        {allowed && <Hero data={data} />}
      </ThemeProvider>
    </GuestProvider>
  );
}
