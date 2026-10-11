import {
  BedDouble,
  Flag,
  MoonStar,
  ShoppingBag,
  SquareParking,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/** nearby places the couple can pin around the venue */
export type MarkerKind = "kuliner" | "hotel" | "ibadah" | "parkir" | "belanja" | "landmark";

/** things drawn into the map illustration itself, shown in the legend only */
export type MapFeature = "sungai" | "jalan" | "gang" | "bangunan" | "taman";

export type MapPoint = { x: number; y: number };

export type MapMarker = MapPoint & { id: string; kind: MarkerKind; label: string };

/** positions are percentages (0–100) of the map image, so they survive any display size */
export type MapMeta = {
  pin: MapPoint | null;
  markers: MapMarker[];
  features: MapFeature[];
};

export const MARKER_KINDS: Record<MarkerKind, { label: string; color: string; icon: LucideIcon }> = {
  kuliner: { label: "Restoran / kuliner", color: "#EE8A3C", icon: UtensilsCrossed },
  hotel: { label: "Hotel / penginapan", color: "#E2589A", icon: BedDouble },
  ibadah: { label: "Tempat ibadah", color: "#3E7F9E", icon: MoonStar },
  parkir: { label: "Parkir", color: "#4C6FBF", icon: SquareParking },
  belanja: { label: "Belanja", color: "#8C6BC2", icon: ShoppingBag },
  landmark: { label: "Landmark", color: "#4E9C8F", icon: Flag },
};

export const MAP_FEATURES: Record<MapFeature, string> = {
  sungai: "Sungai / kanal",
  jalan: "Jalan utama",
  gang: "Jalan / gang",
  bangunan: "Bangunan",
  taman: "Taman / ruang hijau",
};

export const ALL_FEATURES = Object.keys(MAP_FEATURES) as MapFeature[];

const clampPct = (v: unknown) => Math.min(100, Math.max(0, Number(v) || 0));

/** tolerant parse of the stored JSON; anything malformed falls back to an empty map */
export function parseMapMeta(raw: string | undefined | null): MapMeta {
  const empty: MapMeta = { pin: null, markers: [], features: ALL_FEATURES };
  if (!raw) return empty;
  try {
    const data = JSON.parse(raw);
    const pin =
      data?.pin && typeof data.pin === "object" ? { x: clampPct(data.pin.x), y: clampPct(data.pin.y) } : null;
    const markers: MapMarker[] = Array.isArray(data?.markers)
      ? data.markers
          .filter((m: Partial<MapMarker>) => m && (m.kind as string) in MARKER_KINDS)
          .map((m: MapMarker, i: number) => ({
            id: String(m.id || i),
            x: clampPct(m.x),
            y: clampPct(m.y),
            kind: m.kind,
            label: String(m.label ?? "").slice(0, 60),
          }))
      : [];
    const features = Array.isArray(data?.features)
      ? (data.features as string[]).filter((f): f is MapFeature => f in MAP_FEATURES)
      : ALL_FEATURES;
    return { pin, markers, features };
  } catch {
    return empty;
  }
}

export const serializeMapMeta = (meta: MapMeta) => JSON.stringify(meta);
