"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Music2, Upload } from "lucide-react";
import { adminUpload, mediaUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useAdminData } from "@/components/admin/admin-data";
import { Button } from "@/components/ui/button";
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
    label: "URL musik latar (atau unggah di atas)",
    type: "url",
    placeholder: "https://.../lagu.mp3",
    hint: "File audio yang bisa diputar langsung (mp3/ogg). Kosongkan untuk mematikan musik.",
    wide: true,
  },
];

const MAX_AUDIO = 4 * 1024 * 1024;

function MusicUpload({ current, onUploaded }: { current: string; onUploaded: (url: string) => void }) {
  const { refresh } = useAdminData();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    const token = getToken();
    if (!token) return;
    if (file.size > MAX_AUDIO) {
      toast.error("Ukuran lagu maksimal 4MB");
      return;
    }
    setBusy(true);
    try {
      // the upload endpoint writes music_url into settings itself
      const { url } = await adminUpload(token, file, "music");
      onUploaded(url);
      await refresh();
      toast.success("Lagu diunggah");
    } catch {
      toast.error("Gagal mengunggah lagu");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <input
        ref={input}
        type="file"
        accept=".mp3,.ogg,.m4a,.wav,audio/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
        <Upload />
        {busy ? "Mengunggah..." : current ? "Ganti lagu" : "Unggah lagu"}
      </Button>
      <span className="text-muted-foreground text-xs">mp3 / ogg / m4a, maksimal 4MB</span>
      {current && (
        <div className="flex w-full items-center gap-2">
          <Music2 className="text-muted-foreground h-4 w-4 flex-none" />
          <audio controls src={mediaUrl(current)} className="h-9 w-full max-w-sm" />
        </div>
      )}
    </div>
  );
}

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
          <MusicUpload current={draft.music_url} onUploaded={(url) => set("music_url", url)} />
          <FieldGrid fields={MUSIC} draft={draft} set={set} />
        </CardContent>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
