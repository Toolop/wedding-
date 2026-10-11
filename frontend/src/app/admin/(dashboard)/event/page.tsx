"use client";

import { FieldGrid, SaveBar, useSettingsDraft, type FieldDef } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resepsi</CardTitle>
            <CardDescription>Tanggal dan waktu ditulis apa adanya di undangan.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGrid fields={RESEPSI} draft={draft} set={set} />
          </CardContent>
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
