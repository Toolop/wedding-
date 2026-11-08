"use client";

import { CircleAlert, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { adminCreateGuest, adminImportGuests, adminUpdateGuest, apiErrorMessage, type GuestInput } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  downloadGuestTemplate,
  formatPhone,
  normalizePhone,
  parseGuestSheet,
  parseGuestText,
  type ParsedRow,
} from "@/lib/guests";
import type { Guest, GuestMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export const GUEST_MODES: { value: GuestMode; label: string; hint: string }[] = [
  { value: "", label: "Default", hint: "Ikut bawaan: Dashboard" },
  { value: "dashboard", label: "Dashboard", hint: "Satu layar, tiap bagian dibuka sebagai pop-up" },
  { value: "scroll", label: "Scroll", hint: "Satu halaman panjang yang di-scroll" },
];

/** how a guest's invitation opens: which layout, and whether the comic plays first */
export function GuestOpeningFields({
  mode,
  skipComic,
  onChange,
}: {
  mode: GuestMode;
  skipComic: boolean;
  onChange: (next: { mode?: GuestMode; skip_comic?: boolean }) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="grid gap-2">
        <Label>Tampilan undangan</Label>
        <div role="radiogroup" className="grid grid-cols-3 gap-1.5">
          {GUEST_MODES.map((m) => (
            <button
              key={m.value || "default"}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => onChange({ mode: m.value })}
              className={cn(
                "rounded-md border px-2 py-1.5 text-sm transition-colors",
                mode === m.value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{GUEST_MODES.find((m) => m.value === mode)?.hint}</p>
      </div>
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-primary"
          checked={!skipComic}
          onChange={(e) => onChange({ skip_comic: !e.target.checked })}
        />
        <span>
          Tampilkan komik pembuka
          <span className="block text-xs text-muted-foreground">
            Kalau dimatikan, tamu langsung melihat amplop &quot;Buka Undangan&quot;.
          </span>
        </span>
      </label>
    </div>
  );
}

/** add one guest, or edit `guest` when given */
export function GuestFormDialog({
  open,
  onOpenChange,
  guest,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: Guest | null;
  categories: string[];
  onSaved: () => void;
}) {
  const empty: GuestInput = { name: "", phone: "", category: "", mode: "", skip_comic: false };
  const [draft, setDraft] = useState<GuestInput>(empty);
  const [saving, setSaving] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);
  // reset the form each time the dialog opens
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setDraft(
        guest
          ? {
              name: guest.name,
              phone: guest.phone ? `+${guest.phone}` : "",
              category: guest.category,
              mode: guest.mode ?? "",
              skip_comic: guest.skip_comic ?? false,
            }
          : empty
      );
    }
  }

  const phoneOk = normalizePhone(draft.phone) !== null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      if (guest) await adminUpdateGuest(token, guest.id, draft);
      else await adminCreateGuest(token, draft);
      toast.success(guest ? "Tamu diperbarui" : `${draft.name.trim()} ditambahkan`);
      onSaved();
      if (guest) onOpenChange(false);
      // keep the dialog open for adding the next guest
      // (and the category and opening choices, which usually repeat for a batch)
      else setDraft((d) => ({ ...empty, category: d.category, mode: d.mode, skip_comic: d.skip_comic }));
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal menyimpan tamu"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={save} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{guest ? "Ubah tamu" : "Tambah tamu"}</DialogTitle>
            <DialogDescription>
              Nama ini yang muncul di undangan, jadi tamu tidak perlu mengetik namanya lagi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="guest-name">Nama</Label>
            <Input
              id="guest-name"
              autoFocus
              required
              minLength={2}
              maxLength={100}
              placeholder="Bpk. Budi Santoso & Keluarga"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="guest-phone">No WhatsApp</Label>
            <Input
              id="guest-phone"
              inputMode="tel"
              placeholder="0812 3456 7890"
              aria-invalid={!phoneOk}
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
            <p className={cn("text-xs", phoneOk ? "text-muted-foreground" : "text-destructive")}>
              {phoneOk ? "Boleh kosong. Format 08… atau +62… sama-sama bisa." : "Nomor tidak valid"}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="guest-category">Kategori</Label>
            <Input
              id="guest-category"
              list="guest-categories"
              maxLength={50}
              placeholder="Keluarga, Teman kantor, …"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
            <datalist id="guest-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <GuestOpeningFields
            mode={draft.mode ?? ""}
            skipComic={draft.skip_comic ?? false}
            onChange={(next) => setDraft({ ...draft, ...next })}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {guest ? "Batal" : "Selesai"}
            </Button>
            <Button type="submit" disabled={saving || draft.name.trim().length < 2 || !phoneOk}>
              {saving && <LoaderCircle className="animate-spin" />}
              {guest ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** bulk add from an Excel/CSV file or pasted lines, with a preview before saving */
export function GuestImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [source, setSource] = useState("");
  const [pasted, setPasted] = useState("");
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = (next: boolean) => {
    if (!next) {
      setRows(null);
      setSource("");
      setPasted("");
    }
    onOpenChange(next);
  };

  const readFile = async (file?: File) => {
    if (!file) return;
    setReading(true);
    try {
      const parsed = await parseGuestSheet(file);
      if (!parsed.length) toast.error("Tidak ada data tamu di file ini");
      else {
        setRows(parsed);
        setSource(file.name);
      }
    } catch {
      toast.error("File tidak bisa dibaca. Gunakan .xlsx, .xls, atau .csv");
    } finally {
      setReading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const valid = rows?.filter((r) => !r.error) ?? [];
  const invalid = (rows?.length ?? 0) - valid.length;

  const save = async () => {
    const token = getToken();
    if (!token || !valid.length) return;
    setSaving(true);
    try {
      const res = await adminImportGuests(
        token,
        valid.map(({ name, phone, category }) => ({ name, phone, category }))
      );
      const dupes = res.skipped.filter((s) => s.reason === "sudah ada di daftar").length;
      toast.success(`${res.created} tamu ditambahkan`, {
        description: res.skipped.length
          ? `${res.skipped.length} dilewati${dupes ? ` (${dupes} sudah ada di daftar)` : ""}`
          : undefined,
      });
      onImported();
      close(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal mengimpor tamu"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import daftar tamu</DialogTitle>
          <DialogDescription>
            Dari file Excel (.xlsx, .xls) atau CSV dengan kolom <b>Nama</b>, <b>No WhatsApp</b>, dan{" "}
            <b>Kategori</b> (opsional). Tamu yang nomornya sudah ada akan dilewati.
          </DialogDescription>
        </DialogHeader>

        {!rows ? (
          <div className="grid gap-4">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                readFile(e.dataTransfer.files[0]);
              }}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              {reading ? <LoaderCircle className="size-8 animate-spin" /> : <FileSpreadsheet className="size-8" />}
              <span className="font-medium text-foreground">Pilih atau seret file Excel ke sini</span>
              <span>.xlsx, .xls, atau .csv — baris pertama boleh berisi judul kolom</span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv,.ods"
              className="hidden"
              onChange={(e) => readFile(e.target.files?.[0])}
            />
            <Button variant="link" size="sm" className="justify-self-start px-0" onClick={downloadGuestTemplate}>
              Unduh template Excel
            </Button>

            <div className="grid gap-2">
              <Label htmlFor="guest-paste">Atau tempel daftar, satu tamu per baris</Label>
              <Textarea
                id="guest-paste"
                rows={5}
                placeholder={"Budi Santoso, 081234567890, Keluarga\nSiti Aminah, 085712345678\nPak RT"}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
              />
              <Button
                variant="outline"
                className="justify-self-end"
                disabled={!pasted.trim()}
                onClick={() => {
                  setRows(parseGuestText(pasted));
                  setSource("teks yang ditempel");
                }}
              >
                Lanjut
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Dari {source}:</span>
              <Badge variant="secondary">{valid.length} siap diimpor</Badge>
              {invalid > 0 && (
                <Badge variant="outline" className="gap-1 text-destructive">
                  <CircleAlert className="size-3" />
                  {invalid} perlu dicek
                </Badge>
              )}
            </div>
            <div className="max-h-80 overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    <TableHead className="w-12 pl-3">Baris</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>No WhatsApp</TableHead>
                    <TableHead>Kategori</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.row} className={cn(r.error && "bg-destructive/5")}>
                      <TableCell className="pl-3 text-muted-foreground tabular-nums">{r.row}</TableCell>
                      <TableCell className="font-medium">{r.name || "—"}</TableCell>
                      <TableCell className="tabular-nums">
                        {r.error ? (
                          <span className="text-destructive">
                            {r.phone || "—"} · {r.error}
                          </span>
                        ) : (
                          formatPhone(r.phone) || <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.category || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {invalid > 0 && (
              <p className="text-xs text-muted-foreground">
                Baris yang perlu dicek tidak ikut diimpor. Perbaiki di file lalu impor lagi — tamu yang sudah masuk
                akan dilewati otomatis.
              </p>
            )}
          </div>
        )}

        {rows && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRows(null)} disabled={saving}>
              Ganti file
            </Button>
            <Button onClick={save} disabled={saving || !valid.length}>
              {saving ? <LoaderCircle className="animate-spin" /> : <Upload />}
              Impor {valid.length} tamu
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
