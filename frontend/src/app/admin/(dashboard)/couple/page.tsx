"use client";

import { FieldGrid, SaveBar, useSettingsDraft, type FieldDef } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const KEYS = [
  "groom_name",
  "groom_full_name",
  "groom_parents",
  "groom_instagram",
  "bride_name",
  "bride_full_name",
  "bride_parents",
  "bride_instagram",
  "quote",
  "quote_author",
] as const;
type Key = (typeof KEYS)[number];

const GROOM: FieldDef<Key>[] = [
  { key: "groom_name", label: "Nama panggilan", placeholder: "Rafi" },
  { key: "groom_full_name", label: "Nama lengkap" },
  { key: "groom_parents", label: "Orang tua", placeholder: "Putra dari Bapak ... & Ibu ...", wide: true },
  { key: "groom_instagram", label: "Instagram", placeholder: "@username" },
];

const BRIDE: FieldDef<Key>[] = [
  { key: "bride_name", label: "Nama panggilan" },
  { key: "bride_full_name", label: "Nama lengkap" },
  { key: "bride_parents", label: "Orang tua", placeholder: "Putri dari Bapak ... & Ibu ...", wide: true },
  { key: "bride_instagram", label: "Instagram", placeholder: "@username" },
];

const QUOTE: FieldDef<Key>[] = [
  { key: "quote", label: "Kutipan", type: "textarea", wide: true },
  { key: "quote_author", label: "Sumber kutipan", placeholder: "QS. Ar-Rum: 21" },
];

export default function CouplePage() {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft(KEYS);

  return (
    <>
      <PageHeader title="Mempelai" description="Nama, orang tua, dan kutipan yang tampil di undangan." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mempelai pria</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGrid fields={GROOM} draft={draft} set={set} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mempelai wanita</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGrid fields={BRIDE} draft={draft} set={set} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Kutipan</CardTitle>
          <CardDescription>Ayat atau kalimat pembuka undangan.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGrid fields={QUOTE} draft={draft} set={set} />
        </CardContent>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
