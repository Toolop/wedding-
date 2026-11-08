"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Toaster } from "react-hot-toast";
import type { InvitationData } from "@/lib/types";
import { GuestProvider, type GuestAccess, type InvitedGuest } from "./invitation/guest";
import PetalRain from "./PetalRain";
import ThemeProvider from "./ThemeProvider";
import ComicIntro from "./invitation/ComicIntro";
import CuteCursor from "./invitation/CuteCursor";
import OpeningScreen from "./invitation/OpeningScreen";
import Hero from "./invitation/Hero";
import ScrollInvitation from "./invitation/ScrollInvitation";
import MusicToggle from "./invitation/MusicToggle";
import { WatercolorDefs } from "./invitation/WatercolorArt";

type Stage = "comic" | "envelope" | "opened";
type Mode = "dashboard" | "scroll";

/** the layout the admin chose for this guest; ?mode= in the link overrides it (handy for previews) */
function initialMode(guest: InvitedGuest | null): Mode {
  if (typeof window === "undefined") return "dashboard";
  const pick = new URLSearchParams(window.location.search).get("mode") || guest?.mode || "";
  return pick === "scroll" ? "scroll" : "dashboard";
}

/** the dashboard fits one screen only from `lg` up; below that it is taller than a phone */
const DESKTOP = "(min-width: 1024px)";
function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => true
  );
}

export default function InvitationClient({
  data,
  access,
}: {
  data: InvitationData;
  access: GuestAccess;
}) {
  const allowed = access.status === "ok";
  const guest = allowed ? access.guest : null;
  // the admin can let a guest skip the comic and land straight on the envelope
  const [current, setStage] = useState<Stage>(guest?.skip_comic ? "envelope" : "comic");
  // the song begins when the guest opens their eyes in the comic (or skips it);
  // without the comic, it begins when they open the envelope
  const [music, setMusic] = useState(false);
  const { settings } = data;
  // without a valid personal link the envelope stays shut, whatever stage we start at
  const stage: Stage = allowed || current === "comic" ? current : "envelope";

  // two ways to read it, the one-screen dashboard or one long page to scroll; the guest
  // gets the one set for them, with no switch (this mounts client-side, so window is there)
  const [mode] = useState<Mode>(() => initialMode(guest));

  // on desktop the dashboard is a single screen (every section opens as a pop-up), so the page
  // never scrolls; on a phone it is taller than the screen, and the scroll mode is a long page
  const isDesktop = useIsDesktop();
  const scrolling = stage === "opened" && (mode === "scroll" || !isDesktop);
  useEffect(() => {
    const html = document.documentElement.style;
    const body = document.body.style;
    const prev = [html.overflow, body.overflow, body.overscrollBehavior];
    html.overflow = scrolling ? "" : "hidden";
    body.overflow = scrolling ? "" : "hidden";
    body.overscrollBehavior = scrolling ? "" : "none";
    return () => {
      [html.overflow, body.overflow, body.overscrollBehavior] = prev;
    };
  }, [scrolling]);

  return (
    <GuestProvider value={guest}>
      <ThemeProvider settings={settings} scroll={scrolling}>
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
              onOpen={() => {
                if (!allowed) return;
                // a tap is the gesture browsers need before they let the song play
                setMusic(true);
                setStage("opened");
              }}
            />
          )}
        </AnimatePresence>

        {/* mounted for the whole visit so the song runs through comic, envelope and invitation */}
        <MusicToggle musicUrl={settings.music_url} start={music} />

        {/* mounted only once the envelope opens: the comic and envelope fade in and out,
            and anything rendered behind them would flash through during those fades */}
        {stage === "opened" && (
          <>
            {mode === "scroll" ? <ScrollInvitation data={data} /> : <Hero data={data} />}
          </>
        )}
      </ThemeProvider>
    </GuestProvider>
  );
}
