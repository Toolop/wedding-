"use client";

import OpeningScreen from "@/components/invitation/OpeningScreen";
import { WatercolorDefs } from "@/components/invitation/WatercolorArt";
import type { Settings } from "@/lib/types";

const settings = {
  groom_name: "Rafi",
  bride_name: "Tiara",
  wedding_date: "2026-12-12T08:00:00+07:00",
} as unknown as Settings;

export default function Page() {
  const blocked = typeof window !== "undefined" && window.location.hash === "#blocked";
  return (
    <>
      <WatercolorDefs />
      <OpeningScreen settings={settings} blocked={blocked ? "missing" : null} onOpen={() => console.log("OPEN")} />
    </>
  );
}
