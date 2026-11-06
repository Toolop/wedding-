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
  const [current, setStage] = useState<Stage>("comic");
  // the song begins when the guest opens their eyes in the comic (or skips it)
  const [music, setMusic] = useState(false);
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
              background: "#FCFDF9",
              color: "#2F3D35",
              border: "2px dashed #2F3D35",
              borderRadius: "999px",
              fontFamily: "Nunito, sans-serif",
              fontWeight: 600,
            },
            iconTheme: { primary: "#C2676A", secondary: "#FCFDF9" },
          }}
        />
        {/* same paper as the comic and envelope, so the gap between their fades doesn't flash */}
        {stage !== "opened" && <div aria-hidden className="fixed inset-0 -z-10 bg-[#F2F6EF]" />}
        <PetalRain />
        <AnimatePresence mode="wait">
          {stage === "comic" && (
            <ComicIntro
              key="comic"
              settings={settings}
              onWake={() => setMusic(true)}
              onFinish={() => {
                setMusic(true);
                setStage("envelope");
              }}
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

        {/* mounted for the whole visit so the song runs through comic, envelope and invitation */}
        <MusicToggle musicUrl={settings.music_url} start={music} />

        {/* mounted only once the envelope opens: the comic and envelope fade in and out,
            and anything rendered behind them would flash through during those fades */}
        {stage === "opened" && <Hero data={data} />}
      </ThemeProvider>
    </GuestProvider>
  );
}
