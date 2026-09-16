"use client";

import { CSSProperties, ReactNode, useSyncExternalStore } from "react";
import type { Settings } from "@/lib/types";

const PORTAL_ID = "flo-portal";
const noopSubscribe = () => () => {};

/** the themed portal node; null until ThemeProvider has mounted it */
export function usePortalRoot() {
  return useSyncExternalStore(
    noopSubscribe,
    () => document.getElementById(PORTAL_ID),
    () => null
  );
}

export default function ThemeProvider({
  settings,
  children,
}: {
  settings: Settings;
  children: ReactNode;
}) {
  const style = {
    "--color-primary": settings.primary_color || "#2E3237",
    "--color-secondary": settings.secondary_color || "#E5E3DE",
    "--color-accent": settings.accent_color || "#4A7FA5",
    "--color-surface": settings.background_color || "#F4F2EE",
    "--font-heading": settings.font_heading || "'Patrick Hand', cursive",
    "--font-body": settings.font_body || "'Nunito', sans-serif",
    fontFamily: "var(--font-body)",
    backgroundColor: "var(--color-surface)",
  } as CSSProperties;

  return (
    <div style={style} className="h-[100dvh] overflow-hidden">
      {children}
      {/* pop-ups render here: outside the hero's stacking context, inside the theme vars */}
      <div id={PORTAL_ID} />
    </div>
  );
}
