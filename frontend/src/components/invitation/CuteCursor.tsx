"use client";

import { useEffect } from "react";

const HEARTS = 3;

/**
 * Switches the invitation to the hand-drawn cursors in globals.css and pops a
 * few hearts wherever a guest clicks. The admin never mounts this, so it keeps
 * the normal system cursors.
 */
export default function CuteCursor() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("cute-cursor");

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      for (let i = 0; i < HEARTS; i++) {
        const heart = document.createElement("span");
        heart.className = "click-heart";
        // fan the hearts upward, a little different every click
        const angle = -Math.PI / 2 + (i - (HEARTS - 1) / 2) * 0.75 + (Math.random() - 0.5) * 0.35;
        const dist = 26 + Math.random() * 14;
        heart.style.left = `${e.clientX}px`;
        heart.style.top = `${e.clientY}px`;
        heart.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
        heart.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
        heart.style.setProperty("--rot", `${(Math.random() - 0.5) * 50}deg`);
        heart.addEventListener("animationend", () => heart.remove(), { once: true });
        document.body.appendChild(heart);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      root.classList.remove("cute-cursor");
      window.removeEventListener("pointerdown", onPointerDown);
      document.querySelectorAll(".click-heart").forEach((el) => el.remove());
    };
  }, []);

  return null;
}
