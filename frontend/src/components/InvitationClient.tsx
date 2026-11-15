"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Toaster } from "react-hot-toast";
import type { InvitationData } from "@/lib/types";
import { GuestProvider, type GuestAccess, type InvitedGuest } from "./invitation/guest";
import ThemeProvider from "./ThemeProvider";
import ComicIntro from "./invitation/ComicIntro";
import OpeningScreen from "./invitation/OpeningScreen";
import Hero from "./invitation/Hero";
import ScrollInvitation from "./invitation/ScrollInvitation";
import MusicToggle from "./invitation/MusicToggle";
import { WatercolorDefs } from "./invitation/WatercolorArt";
import { colors, readColor } from "./invitation/theme";

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
  // a guest invited to the resepsi only gets the invitation without any akad details
  const settings = useMemo(
    () =>
      guest?.skip_akad
        ? {
            ...data.settings,
            akad_date: "",
            akad_time: "",
            akad_location: "",
            akad_address: "",
            akad_maps_url: "",
            akad_map_image: "",
            akad_map_meta: "",
            akad_venue_photo: "",
          }
        : data.settings,
    [data.settings, guest?.skip_akad]
  );
  const shown = useMemo(() => ({ ...data, settings }), [data, settings]);
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
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: colors.paper,
              color: colors.ink,
              border: `1px solid ${colors.line}`,
              borderRadius: "6px",
              fontFamily: "Jost, sans-serif",
              fontWeight: 500,
            },
            iconTheme: { primary: readColor(colors.brand), secondary: readColor(colors.paper) },
          }}
        />
        {/* same paper as the comic and envelope, so the gap between their fades doesn't flash */}
        {stage !== "opened" && <div aria-hidden className="fixed inset-0 -z-10 bg-page" />}
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
              // the song starts on the tap itself (browsers only allow sound right after a
              // gesture); the page changes once the envelope-opening animation has played
              onTap={() => allowed && setMusic(true)}
              onOpen={() => allowed && setStage("opened")}
            />
          )}
        </AnimatePresence>

        {/* mounted for the whole visit so the song runs through comic, envelope and invitation */}
        <MusicToggle musicUrl={settings.music_url} start={music} />

        {/* mounted only once the envelope opens: the comic and envelope fade in and out,
            and anything rendered behind them would flash through during those fades */}
        {stage === "opened" && (
          <>
            {mode === "scroll" ? <ScrollInvitation data={shown} /> : <Hero data={shown} />}
          </>
        )}
      </ThemeProvider>
    </GuestProvider>
  );
}
