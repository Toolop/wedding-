"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import type { InvitationData } from "@/lib/types";
import PetalRain from "./PetalRain";
import ThemeProvider from "./ThemeProvider";
import ComicIntro from "./invitation/ComicIntro";
import OpeningScreen from "./invitation/OpeningScreen";
import Hero from "./invitation/Hero";
import Countdown from "./invitation/Countdown";
import CoupleSection from "./invitation/CoupleSection";
import MagicalBloom from "./invitation/MagicalBloom";
import LoveStory from "./invitation/LoveStory";
import EventDetails from "./invitation/EventDetails";
import Gallery from "./invitation/Gallery";
import GiftInfo from "./invitation/GiftInfo";
import RSVPForm from "./invitation/RSVPForm";
import WishesList from "./invitation/WishesList";
import Footer from "./invitation/Footer";
import MusicToggle from "./invitation/MusicToggle";

type Stage = "comic" | "envelope" | "opened";

export default function InvitationClient({ data }: { data: InvitationData }) {
  const [stage, setStage] = useState<Stage>("comic");
  const [wishesRefresh, setWishesRefresh] = useState(0);
  const { settings, story, gallery } = data;

  return (
    <ThemeProvider settings={settings}>
      <Toaster position="top-center" />
      <PetalRain />
      <AnimatePresence mode="wait">
        {stage === "comic" && (
          <ComicIntro
            key="comic"
            settings={settings}
            onFinish={() => setStage("envelope")}
          />
        )}
        {stage === "envelope" && (
          <OpeningScreen
            key="envelope"
            settings={settings}
            onOpen={() => {
              setStage("opened");
              document.body.style.overflow = "auto";
            }}
          />
        )}
      </AnimatePresence>

      {stage === "opened" && <MusicToggle musicUrl={settings.music_url} autoStart />}

      <div className={stage === "opened" ? "" : "h-screen overflow-hidden"}>
        <Hero settings={settings} />
        <Countdown target={settings.wedding_date} />
        <CoupleSection settings={settings} />
        <MagicalBloom />
        <LoveStory story={story} />
        <EventDetails settings={settings} />
        <Gallery gallery={gallery} />
        <GiftInfo settings={settings} />
        <RSVPForm onSubmitted={() => setWishesRefresh((k) => k + 1)} />
        <WishesList refreshKey={wishesRefresh} />
        <Footer settings={settings} />
      </div>
    </ThemeProvider>
  );
}
