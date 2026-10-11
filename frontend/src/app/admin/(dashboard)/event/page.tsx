"use client";

import { Camera, ImageOff, MapPinned, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminData } from "@/components/admin/admin-data";
import { MapMetaEditor } from "@/components/admin/map-editor";
import { FieldGrid, SaveBar, useSettingsDraft, type FieldDef, type TextKey } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/site-header";
import { UploadButton } from "@/components/admin/upload-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminUpload, mediaUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";

const KEYS = [
  "wedding_date",
  "akad_date",
  "akad_time",
  "akad_location",
  "akad_address",
  "akad_maps_url",
  "resepsi_date",
  "resepsi_time",
  "resepsi_location",
  "resepsi_address",
  "resepsi_maps_url",
] as const;
type Key = (typeof KEYS)[number];

const MAIN: FieldDef<Key>[] = [
  {
    key: "wedding_date",
    label: "Tanggal & waktu",
    type: "datetime",
    hint: "Dipakai untuk hitung mundur di undangan.",
  },
];

const AKAD: FieldDef<Key>[] = [
  { key: "akad_date", label: "Tanggal", placeholder: "Sabtu, 12 Desember 2026" },
  { key: "akad_time", label: "Waktu", placeholder: "08.00 – 10.00 WIB" },
  { key: "akad_location", label: "Tempat", wide: true },
  { key: "akad_address", label: "Alamat", type: "textarea", wide: true },
  { key: "akad_maps_url", label: "Link Google Maps", type: "url", placeholder: "https://maps.app.goo.gl/...", wide: true },
];

const RESEPSI: FieldDef<Key>[] = [
  { key: "resepsi_date", label: "Tanggal", placeholder: "Sabtu, 12 Desember 2026" },
  { key: "resepsi_time", label: "Waktu", placeholder: "11.00 – 14.00 WIB" },
  { key: "resepsi_location", label: "Tempat", wide: true },
  { key: "resepsi_address", label: "Alamat", type: "textarea", wide: true },
  { key: "resepsi_maps_url", label: "Link Google Maps", type: "url", placeholder: "https://maps.app.goo.gl/...", wide: true },
];

/** optional illustrated map shown under the event's ticket in the invitation */
const sameText = (a: string, b: string) => {
  const norm = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();
  return !!norm(a) && norm(a) === norm(b);
};

/** upload / replace / remove one settings image through the upload endpoint */
function useImageSlot(target: "akad_map" | "resepsi_map" | "akad_venue" | "resepsi_venue", key: TextKey, what: string) {
  const { refresh, updateSettings } = useAdminData();
  const [busy, setBusy] = useState(false);

  const upload = async ([file]: File[]) => {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      // the upload endpoint writes the new URL into settings itself
      await adminUpload(token, file, target);
      await refresh();
      toast.success(`${what} diperbarui`);
    } catch {
      toast.error(`Gagal mengunggah ${what.toLowerCase()}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await updateSettings({ [key]: "" });
      toast.success(`${what} dihapus`);
    } catch {
      toast.error(`Gagal menghapus ${what.toLowerCase()}`);
    } finally {
      setBusy(false);
    }
  };

  return { busy, upload, remove };
}

/** map picture with its pin editor, plus the venue photo shown as a polaroid beside the legend */
function MapImageSlot({ event }: { event: "akad" | "resepsi" }) {
  const { settings, updateSettings } = useAdminData();
  const key = event === "akad" ? "akad_map_image" : "resepsi_map_image";
  const metaKey = event === "akad" ? "akad_map_meta" : "resepsi_map_meta";
  const photoKey = event === "akad" ? "akad_venue_photo" : "resepsi_venue_photo";
  const image = settings[key];
  const photo = settings[photoKey];
  const map = useImageSlot(`${event}_map`, key, "Peta");
  const venue = useImageSlot(`${event}_venue`, photoKey, "Foto tempat");

  // akad at the resepsi venue: the invitation shows one shared map, taken from resepsi
  const sharesResepsi =
    event === "akad" &&
    (sameText(settings.akad_location, settings.resepsi_location) ||
      sameText(settings.akad_address, settings.resepsi_address));
  if (sharesResepsi && settings.resepsi_map_image && !image) {
    return (
      <div className="mt-6 flex gap-3 rounded-lg border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground">
        <MapPinned className="mt-0.5 size-4 shrink-0" />
        <p>
          Lokasi akad sama dengan resepsi, jadi undangan menampilkan <b className="text-foreground">satu peta gabungan</b>.
          Peta, pin, dan foto tempatnya diatur di kartu Resepsi.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 border-t pt-4">
      {sharesResepsi && (
        <p className="flex gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
          <MapPinned className="size-4 shrink-0" />
          Lokasi akad sama dengan resepsi; undangan memakai satu peta gabungan (peta resepsi didahulukan bila ada).
        </p>
      )}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Peta ilustrasi</p>
            <p className="text-xs text-muted-foreground">
              Opsional. Pasang pin lokasi dan penanda sekitar; tamu mengetuk pin untuk melihat semuanya.
            </p>
          </div>
          <div className="flex gap-2">
            {image && (
              <Button variant="ghost" size="sm" disabled={map.busy} onClick={map.remove} aria-label="Hapus peta">
                <Trash2 />
              </Button>
            )}
            <UploadButton label={image ? "Ganti" : "Unggah"} onFiles={map.upload} busy={map.busy} />
          </div>
        </div>
        {image ? (
          <MapMetaEditor
            // remount on save/upload so the editor starts from what's stored
            key={`${image}|${settings[metaKey]}`}
            image={image}
            value={settings[metaKey]}
            onSave={async (json) => {
              await updateSettings({ [metaKey]: json });
            }}
          />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border bg-muted text-sm text-muted-foreground">
            <ImageOff className="size-6" />
            Belum ada peta
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-3">
        <div className="aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(photo)} alt="Foto tempat" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Camera className="size-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Foto tempat</p>
          <p className="text-xs text-muted-foreground">Tampil sebagai polaroid di samping legenda peta.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {photo && (
            <Button variant="ghost" size="sm" disabled={venue.busy} onClick={venue.remove} aria-label="Hapus foto tempat">
              <Trash2 />
            </Button>
          )}
          <UploadButton label={photo ? "Ganti" : "Unggah"} onFiles={venue.upload} busy={venue.busy} />
        </div>
      </div>
    </div>
  );
}

export default function EventPage() {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft(KEYS);

  return (
    <>
      <PageHeader title="Acara" description="Tanggal pernikahan serta detail akad dan resepsi." />
      <Card>
        <CardHeader>
          <CardTitle>Hari H</CardTitle>
        </CardHeader>
        <CardContent className="max-w-md">
          <FieldGrid fields={MAIN} draft={draft} set={set} />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Akad nikah</CardTitle>
            <CardDescription>Tanggal dan waktu ditulis apa adanya di undangan.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGrid fields={AKAD} draft={draft} set={set} />
            <MapImageSlot event="akad" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resepsi</CardTitle>
            <CardDescription>Tanggal dan waktu ditulis apa adanya di undangan.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGrid fields={RESEPSI} draft={draft} set={set} />
            <MapImageSlot event="resepsi" />
          </CardContent>
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
