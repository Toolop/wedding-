"use client";

import { LoaderCircle, MapPin, MousePointerClick, Plus, Save, Trash2, Undo2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mediaUrl } from "@/lib/api";
import {
  ALL_FEATURES,
  MAP_FEATURES,
  MARKER_KINDS,
  parseMapMeta,
  serializeMapMeta,
  type MapMeta,
  type MarkerKind,
} from "@/lib/map-meta";
import { cn } from "@/lib/utils";

const KINDS = Object.keys(MARKER_KINDS) as MarkerKind[];
const round = (v: number) => Math.round(v * 10) / 10;

function KindSelect({ value, onChange }: { value: MarkerKind; onChange: (k: MarkerKind) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MarkerKind)}>
      <SelectTrigger className="w-52 shrink-0" aria-label="Jenis penanda">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {KINDS.map((k) => {
          const Icon = MARKER_KINDS[k].icon;
          return (
            <SelectItem key={k} value={k}>
              <Icon style={{ color: MARKER_KINDS[k].color }} />
              {MARKER_KINDS[k].label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/**
 * Place the venue pin and nearby markers on the uploaded map. Positions are
 * stored as percentages so they line up at every size the invitation shows.
 */
export function MapMetaEditor({
  image,
  value,
  onSave,
}: {
  image: string;
  value: string;
  onSave: (json: string) => Promise<void>;
}) {
  const saved = parseMapMeta(value);
  const [meta, setMeta] = useState<MapMeta>(saved);
  const [mode, setMode] = useState<"pin" | "marker">(saved.pin ? "marker" : "pin");
  const [newKind, setNewKind] = useState<MarkerKind>("kuliner");
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);
  const moved = useRef(false);

  const dirty = serializeMapMeta(meta) !== serializeMapMeta(saved);

  const toPct = (clientX: number, clientY: number) => {
    const r = box.current!.getBoundingClientRect();
    return {
      x: round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))),
      y: round(Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100))),
    };
  };

  const place = (e: React.MouseEvent) => {
    // a click that ends a drag, or lands on an existing handle, doesn't drop anything new
    if (moved.current || (e.target as HTMLElement).closest("[data-drag]")) {
      moved.current = false;
      return;
    }
    const at = toPct(e.clientX, e.clientY);
    if (mode === "pin") {
      setMeta((m) => ({ ...m, pin: at }));
      setMode("marker");
      return;
    }
    const id = crypto.randomUUID().slice(0, 8);
    setMeta((m) => ({ ...m, markers: [...m.markers, { id, ...at, kind: newKind, label: "" }] }));
    setSelected(id);
  };

  // the pin and markers carry data-drag="pin" / their id; the map box handles the dragging
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const handle = (e.target as HTMLElement).closest<HTMLElement>("[data-drag]");
    if (!handle) return;
    const id = handle.dataset.drag!;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = id;
    moved.current = false;
    if (id !== "pin") setSelected(id);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const id = dragging.current;
    if (!id) return;
    moved.current = true;
    const at = toPct(e.clientX, e.clientY);
    setMeta((m) =>
      id === "pin"
        ? { ...m, pin: at }
        : { ...m, markers: m.markers.map((mk) => (mk.id === id ? { ...mk, ...at } : mk)) }
    );
  };

  const onPointerUp = () => {
    dragging.current = null;
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(serializeMapMeta(meta));
      toast.success("Keterangan peta disimpan");
    } catch {
      toast.error("Gagal menyimpan keterangan peta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "pin" ? "default" : "outline"}
          onClick={() => setMode("pin")}
        >
          <MapPin />
          {meta.pin ? "Pindahkan pin" : "Pasang pin lokasi"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "marker" ? "default" : "outline"}
          onClick={() => setMode("marker")}
        >
          <Plus />
          Tambah penanda
        </Button>
        {mode === "marker" && <KindSelect value={newKind} onChange={setNewKind} />}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MousePointerClick className="size-3.5" />
        {mode === "pin"
          ? "Klik tepat di titik lokasi acara pada peta."
          : "Klik di peta untuk menambah penanda. Seret pin atau penanda untuk memindahkannya."}
      </p>

      <div
        ref={box}
        onClick={place}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative cursor-crosshair overflow-hidden rounded-lg border bg-muted select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl(image)} alt="Peta" draggable={false} className="block h-auto w-full" />

        {meta.markers.map((m) => {
          const kind = MARKER_KINDS[m.kind];
          const Icon = kind.icon;
          return (
            <span
              key={m.id}
              data-drag={m.id}
              title={m.label || kind.label}
              className={cn(
                "absolute flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full border-2 border-white shadow active:cursor-grabbing",
                selected === m.id && "ring-2 ring-offset-1 ring-foreground"
              )}
              style={{ left: `${m.x}%`, top: `${m.y}%`, backgroundColor: kind.color }}
            >
              <Icon className="size-3.5 text-white" strokeWidth={2.6} />
            </span>
          );
        })}

        {meta.pin && (
          <span
            data-drag="pin"
            title="Lokasi acara"
            className="absolute -translate-x-1/2 -translate-y-full cursor-grab touch-none active:cursor-grabbing"
            style={{ left: `${meta.pin.x}%`, top: `${meta.pin.y}%` }}
          >
            <MapPin className="size-8 fill-[#D2574A] text-[#2B2522] drop-shadow" strokeWidth={1.6} />
          </span>
        )}
      </div>

      {meta.markers.length > 0 && (
        <ul className="space-y-2">
          {meta.markers.map((m) => (
            <li
              key={m.id}
              className={cn(
                "flex items-center gap-2 rounded-md p-1",
                selected === m.id && "bg-muted"
              )}
              onFocus={() => setSelected(m.id)}
            >
              <KindSelect
                value={m.kind}
                onChange={(kind) =>
                  setMeta((cur) => ({ ...cur, markers: cur.markers.map((x) => (x.id === m.id ? { ...x, kind } : x)) }))
                }
              />
              <Input
                value={m.label}
                maxLength={60}
                placeholder="Nama tempat"
                autoFocus={selected === m.id && !m.label}
                onChange={(e) =>
                  setMeta((cur) => ({
                    ...cur,
                    markers: cur.markers.map((x) => (x.id === m.id ? { ...x, label: e.target.value } : x)),
                  }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive"
                aria-label="Hapus penanda"
                onClick={() => setMeta((cur) => ({ ...cur, markers: cur.markers.filter((x) => x.id !== m.id) }))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Keterangan yang tergambar di peta</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {ALL_FEATURES.map((f) => (
            <label key={f} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-foreground"
                checked={meta.features.includes(f)}
                onChange={(e) =>
                  setMeta((cur) => ({
                    ...cur,
                    features: e.target.checked
                      ? ALL_FEATURES.filter((x) => x === f || cur.features.includes(x))
                      : cur.features.filter((x) => x !== f),
                  }))
                }
              />
              {MAP_FEATURES[f]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={!dirty || saving} onClick={() => setMeta(saved)}>
          <Undo2 />
          Batal
        </Button>
        <Button type="button" size="sm" disabled={!dirty || saving} onClick={save}>
          {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
          Simpan keterangan peta
        </Button>
      </div>
    </div>
  );
}
