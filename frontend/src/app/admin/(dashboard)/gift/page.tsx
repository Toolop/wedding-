"use client";

import { FieldGrid, SaveBar, useSettingsDraft, type FieldDef } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const KEYS = ["bank_name", "bank_account_number", "bank_account_name"] as const;
type Key = (typeof KEYS)[number];

const FIELDS: FieldDef<Key>[] = [
  { key: "bank_name", label: "Bank / e-wallet", placeholder: "BCA" },
  { key: "bank_account_number", label: "Nomor rekening", hint: "Tamu bisa menyalin nomor ini dengan satu ketukan." },
  { key: "bank_account_name", label: "Atas nama", wide: true },
];

export default function GiftPage() {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft(KEYS);

  return (
    <>
      <PageHeader title="Hadiah" description="Rekening untuk tamu yang ingin mengirim hadiah." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Rekening</CardTitle>
          <CardDescription>Tampil di kartu hadiah pada undangan.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGrid fields={FIELDS} draft={draft} set={set} />
        </CardContent>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
