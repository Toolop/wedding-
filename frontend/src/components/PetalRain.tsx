"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

const COLORS = ["#9aa3ab", "#c9cdd1", "#4a7fa5", "#7c868e", "#dddad3"];

interface PetalStyle extends CSSProperties {
  "--drift"?: string;
  "--spin"?: number;
}

interface Petal {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  color: string;
  spin: number;
}

function generatePetals(count: number): Petal[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 8 + Math.random() * 10,
    duration: 10 + Math.random() * 10,
    delay: -Math.random() * 20,
    drift: Math.round((Math.random() - 0.5) * 160),
    color: COLORS[i % COLORS.length],
    spin: Math.random() > 0.5 ? 1 : -1,
  }));
}

export default function PetalRain({ count = 16 }: { count?: number }) {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- randomized decorative positions, client-only
    setPetals(generatePetals(count));
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {petals.map((p) => {
        const style: PetalStyle = {
          left: `${p.left}%`,
          width: p.size,
          height: p.size * 0.8,
          backgroundColor: p.color,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          "--drift": `${p.drift}px`,
          "--spin": p.spin,
        };
        return <span key={p.id} className="petal absolute" style={style} />;
      })}
    </div>
  );
}
