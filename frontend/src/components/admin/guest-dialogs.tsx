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
import type { Guest } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const [draft, setDraft] = useState<GuestInput>({ name: "", phone: "", category: "" });
  const [saving, setSaving] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);
  // reset the form each time the dialog opens
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setDraft(
        guest
          ? { name: guest.name, phone: guest.phone ? `+${guest.phone}` : "", category: guest.category }
          : { name: "", phone: "", category: "" }
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
      else setDraft((d) => ({ name: "", phone: "", category: d.category }));
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
