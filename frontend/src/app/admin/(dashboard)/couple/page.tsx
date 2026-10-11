"use client";

import { UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAdminData } from "@/components/admin/admin-data";
import { CropUploadButton } from "@/components/admin/crop-upload-button";
import { FieldGrid, SaveBar, useSettingsDraft, type FieldDef } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminUpload, mediaUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";

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

function PortraitSlot({ who, label, image }: { who: "groom" | "bride"; label: string; image: string }) {
  const { refresh } = useAdminData();

  const upload = async (file: File) => {
    const token = getToken();
    if (!token) throw new Error("not signed in");
    try {
      // the upload endpoint writes the new URL into settings itself
      await adminUpload(token, file, who);
      await refresh();
      toast.success(`Foto ${label.toLowerCase()} diperbarui`);
    } catch (err) {
      toast.error("Gagal mengunggah foto");
      throw err;
    }
  };

  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="size-24 shrink-0 overflow-hidden rounded-full border bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(image)} alt={`Foto ${label}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <UserRound className="size-8" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {image ? "Foto tampil bulat di kartu mempelai." : "Belum ada foto."}
        </p>
        <CropUploadButton
          label={image ? "Ganti foto" : "Unggah foto"}
          title={`Atur foto ${label.toLowerCase()}`}
          round
          onCropped={upload}
        />
      </div>
    </div>
  );
}

export default function CouplePage() {
  const { settings } = useAdminData();
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft(KEYS);

  return (
    <>
      <PageHeader title="Mempelai" description="Foto, nama, orang tua, dan kutipan yang tampil di undangan." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mempelai pria</CardTitle>
          </CardHeader>
          <CardContent>
            <PortraitSlot who="groom" label="Mempelai pria" image={settings.groom_photo} />
            <FieldGrid fields={GROOM} draft={draft} set={set} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mempelai wanita</CardTitle>
          </CardHeader>
          <CardContent>
            <PortraitSlot who="bride" label="Mempelai wanita" image={settings.bride_photo} />
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
