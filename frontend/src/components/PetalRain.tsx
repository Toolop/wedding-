"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

// baby's-breath white, sage and the odd blush petal
const COLORS = ["#FFFFFF", "#F4F8F1", "#CFE3D4", "#A9C3A6", "#F3DDD8"];

interface Petal {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  path: number;
  color: string;
}

function generatePetals(count: number): Petal[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 8 + Math.random() * 10,
    duration: 10 + Math.random() * 10,
    delay: -Math.random() * 20,
    path: Math.floor(Math.random() * 4),
    color: COLORS[i % COLORS.length],
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
        const style: CSSProperties = {
          left: `${p.left}%`,
          width: p.size,
          height: p.size * 0.8,
          backgroundColor: p.color,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
        };
        // one of four baked fall paths (drift + spin), see .petal-N in globals.css
        return <span key={p.id} className={`petal petal-${p.path} absolute`} style={style} />;
      })}
    </div>
  );
}
