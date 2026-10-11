"use client";

import { FieldGrid, SaveBar, useSettingsDraft, type FieldDef } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const KEYS = [
  "primary_color",
  "secondary_color",
  "accent_color",
  "background_color",
  "font_heading",
  "font_body",
  "music_url",
] as const;
type Key = (typeof KEYS)[number];

const COLORS: FieldDef<Key>[] = [
  { key: "primary_color", label: "Warna utama", type: "color" },
  { key: "secondary_color", label: "Warna sekunder", type: "color" },
  { key: "accent_color", label: "Warna aksen", type: "color" },
  { key: "background_color", label: "Warna permukaan", type: "color" },
];

const FONTS: FieldDef<Key>[] = [
  {
    key: "font_heading",
    label: "Huruf judul",
    placeholder: "'Patrick Hand', cursive",
    hint: "Nilai CSS font-family. Tersedia: Patrick Hand, Caveat, Fredoka, Playfair Display, Cormorant Garamond, Cinzel, Great Vibes.",
  },
  {
    key: "font_body",
    label: "Huruf isi",
    placeholder: "'Nunito', sans-serif",
    hint: "Tersedia: Nunito, Poppins, Cormorant Garamond.",
  },
];

const MUSIC: FieldDef<Key>[] = [
  {
    key: "music_url",
    label: "URL musik latar",
    type: "url",
    placeholder: "https://.../lagu.mp3",
    hint: "File audio yang bisa diputar langsung (mp3/ogg). Kosongkan untuk mematikan musik.",
    wide: true,
  },
];

export default function AppearancePage() {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft(KEYS);

  return (
    <>
      <PageHeader title="Tampilan" description="Warna, huruf, dan musik latar undangan." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Warna</CardTitle>
            <CardDescription>Latar kertas cat air undangan tetap sama, apa pun warnanya.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGrid fields={COLORS} draft={draft} set={set} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Huruf</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGrid fields={FONTS} draft={draft} set={set} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Musik</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGrid fields={MUSIC} draft={draft} set={set} />
        </CardContent>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
