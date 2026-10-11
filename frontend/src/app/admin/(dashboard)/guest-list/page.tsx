"use client";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Link2Off,
  ExternalLink,
  FileSpreadsheet,
  MailCheck,
  MailX,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AttendanceBadge } from "@/components/admin/attendance";
import { useAdminData } from "@/components/admin/admin-data";
import { BroadcastDialog } from "@/components/admin/guest-broadcast";
import { GuestFormDialog, GuestImportDialog } from "@/components/admin/guest-dialogs";
import { SaveBar, useSettingsDraft } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/site-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  adminDeleteGuest,
  adminDeleteGuests,
  adminListGuests,
  adminResetGuestLink,
  adminSendGuestWhatsapp,
  adminUpdateGuest,
  apiErrorMessage,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  DEFAULT_WA_TEMPLATE,
  TEMPLATE_TAGS,
  exportGuests,
  fillTemplate,
  formatPhone,
  guestLink,
  waLink,
} from "@/lib/guests";
import type { Guest } from "@/lib/types";

const PAGE_SIZE = 20;
const TEMPLATE_KEYS = ["wa_template"] as const;

type Status = "all" | "unsent" | "sent" | "opened" | "rsvp" | "no_rsvp";

const STATUS_FILTERS: { value: Status; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "unsent", label: "Belum dikirim" },
  { value: "sent", label: "Sudah dikirim" },
  { value: "opened", label: "Sudah dibuka" },
  { value: "rsvp", label: "Sudah RSVP" },
  { value: "no_rsvp", label: "Belum RSVP" },
];

function matchesStatus(g: Guest, s: Status) {
  switch (s) {
    case "unsent":
      return !g.sent_at;
    case "sent":
      return !!g.sent_at;
    case "opened":
      return !!g.opened_at;
    case "rsvp":
      return !!g.rsvp;
    case "no_rsvp":
      return !g.rsvp;
    default:
      return true;
  }
}

function SendStatus({ guest }: { guest: Guest }) {
  if (guest.opened_at)
    return (
      <Badge variant="outline" className="gap-1 border-sky-500/40 px-1.5 text-sky-700 dark:text-sky-400">
        <MailCheck className="size-3" />
        Dibuka
      </Badge>
    );
  if (guest.sent_at)
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/40 px-1.5 text-emerald-700 dark:text-emerald-400">
        <Send className="size-3" />
        Terkirim
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 px-1.5 text-muted-foreground">
      <MailX className="size-3" />
      Belum dikirim
    </Badge>
  );
}

const copy = (text: string, what: string) =>
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${what} disalin`),
    () => toast.error("Gagal menyalin")
  );

export default function GuestListPage() {
  const { settings } = useAdminData();
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft(TEMPLATE_KEYS);
  const template = draft.wa_template || DEFAULT_WA_TEMPLATE;

  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [gateway, setGateway] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [broadcast, setBroadcast] = useState<Guest[] | null>(null);
  const [deleting, setDeleting] = useState<Guest[] | null>(null);
  const [resetting, setResetting] = useState<Guest | null>(null);

  const load = useCallback(() => {
    const token = getToken();
    if (!token) return;
    adminListGuests(token)
      .then((res) => {
        setGuests(res.items);
        setGateway(res.whatsapp_gateway);
      })
      .catch(() => toast.error("Gagal memuat daftar tamu"));
  }, []);

  useEffect(load, [load]);

  /** merge a guest the API just returned, keeping the RSVP the list already knows */
  const patchGuest = useCallback((g: Omit<Guest, "rsvp">) => {
    setGuests((prev) => prev && prev.map((x) => (x.id === g.id ? { ...x, ...g } : x)));
  }, []);

  const categories = useMemo(
    () => [...new Set((guests ?? []).map((g) => g.category).filter(Boolean))].sort(),
    [guests]
  );

  const stats = useMemo(() => {
    const all = guests ?? [];
    const coming = all.filter((g) => g.rsvp?.attendance === "hadir");
    return {
      total: all.length,
      noPhone: all.filter((g) => !g.phone).length,
      sent: all.filter((g) => g.sent_at).length,
      opened: all.filter((g) => g.opened_at).length,
      rsvp: all.filter((g) => g.rsvp).length,
      coming: coming.reduce((n, g) => n + (g.rsvp?.guest_count || 0), 0),
    };
  }, [guests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return (guests ?? []).filter(
      (g) =>
        matchesStatus(g, status) &&
        (category === "all" || g.category === category) &&
        (!q || g.name.toLowerCase().includes(q) || (digits.length > 2 && g.phone.includes(digits)))
    );
  }, [guests, query, status, category]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const selectedGuests = filtered.filter((g) => selected.has(g.id));
  const unsent = filtered.filter((g) => !g.sent_at);
  const allOnPageSelected = rows.length > 0 && rows.every((g) => selected.has(g.id));

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const g of rows) {
        if (allOnPageSelected) next.delete(g.id);
        else next.add(g.id);
      }
      return next;
    });

  const markSent = async (g: Guest, sent: boolean) => {
    const token = getToken();
    if (!token) return;
    try {
      patchGuest(await adminUpdateGuest(token, g.id, { sent }));
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  const sendViaGateway = async (g: Guest) => {
    const token = getToken();
    if (!token) return;
    const id = toast.loading(`Mengirim ke ${g.name}…`);
    try {
      patchGuest(await adminSendGuestWhatsapp(token, g.id, fillTemplate(template, g, settings)));
      toast.success(`Undangan terkirim ke ${g.name}`, { id });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal mengirim"), { id });
    }
  };

  const confirmResetLink = async () => {
    const token = getToken();
    if (!token || !resetting) return;
    try {
      patchGuest(await adminResetGuestLink(token, resetting.id));
      toast.success(`Link baru untuk ${resetting.name} dibuat`, { description: "Kirim ulang undangannya." });
    } catch {
      toast.error("Gagal membuat link baru");
    } finally {
      setResetting(null);
    }
  };

  const confirmDelete = async () => {
    const token = getToken();
    if (!token || !deleting) return;
    const ids = deleting.map((g) => g.id);
    try {
      if (ids.length === 1) await adminDeleteGuest(token, ids[0]);
      else await adminDeleteGuests(token, ids);
      setGuests((prev) => prev && prev.filter((g) => !ids.includes(g.id)));
      setSelected((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
      toast.success(`${ids.length} tamu dihapus`);
    } catch {
      toast.error("Gagal menghapus tamu");
    } finally {
      setDeleting(null);
    }
  };

  const STAT_CARDS = [
    {
      label: "Total tamu",
      value: stats.total,
      note: stats.noPhone ? `${stats.noPhone} tanpa nomor WhatsApp` : "Semua punya nomor WhatsApp",
    },
    { label: "Sudah dikirim", value: stats.sent, note: `${stats.total - stats.sent} belum dikirim` },
    { label: "Sudah dibuka", value: stats.opened, note: "Membuka link undangannya" },
    { label: "Sudah RSVP", value: stats.rsvp, note: `${stats.coming} orang akan hadir` },
  ];

  const preview = guests?.[0] ?? { name: "Budi Santoso", code: "contoh7k2m9qx4pa" };

  return (
    <>
      <PageHeader
        title="Daftar Tamu"
        description="Tamu undangan beserta link pribadinya. Nama tamu otomatis tertulis di undangan."
      >
        <Button variant="outline" disabled={!guests?.length} onClick={() => exportGuests(filtered)}>
          <Download />
          Ekspor Excel
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <FileSpreadsheet />
          Import Excel
        </Button>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          Tambah tamu
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <Card key={s.label} className="gap-1 py-4">
            <CardHeader className="px-4">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {guests ? s.value : <Skeleton className="h-8 w-12" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 text-xs text-muted-foreground">{s.note}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-2 border-b p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau nomor..."
              aria-label="Cari tamu"
              className="pl-8"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as Status);
                setPage(1);
              }}
            >
              <SelectTrigger className="flex-1 lg:w-40" aria-label="Filter status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length > 0 && (
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="flex-1 lg:w-40" aria-label="Filter kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {selectedGuests.length > 0 ? (
            <div className="flex gap-2">
              <Button variant="outline" className="text-destructive" onClick={() => setDeleting(selectedGuests)}>
                <Trash2 />
                Hapus {selectedGuests.length}
              </Button>
              <Button className="flex-1" onClick={() => setBroadcast(selectedGuests)}>
                <Send />
                Kirim ke {selectedGuests.length} terpilih
              </Button>
            </div>
          ) : (
            <Button disabled={!unsent.length} onClick={() => setBroadcast(unsent)}>
              <Send />
              Kirim ke semua yang belum ({unsent.length})
            </Button>
          )}
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-10 pl-4">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua di halaman ini"
                    className="size-4 accent-primary align-middle"
                    checked={allOnPageSelected}
                    onChange={togglePage}
                  />
                </TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Undangan</TableHead>
                <TableHead>RSVP</TableHead>
                <TableHead className="w-24 pr-4">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests === null ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="px-4">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 size-8" />
                    {guests.length === 0 ? (
                      <>
                        <p>Belum ada tamu.</p>
                        <p className="text-xs">Tambahkan satu per satu atau import dari Excel.</p>
                      </>
                    ) : (
                      "Tidak ada tamu yang cocok dengan filter"
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((g) => {
                  const message = fillTemplate(template, g, settings);
                  return (
                    <TableRow key={g.id} data-state={selected.has(g.id) ? "selected" : undefined}>
                      <TableCell className="pl-4">
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${g.name}`}
                          className="size-4 accent-primary align-middle"
                          checked={selected.has(g.id)}
                          onChange={() => toggle(g.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{g.name}</p>
                        {g.category && <p className="text-xs text-muted-foreground">{g.category}</p>}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {g.phone ? formatPhone(g.phone) : "—"}
                      </TableCell>
                      <TableCell>
                        <SendStatus guest={g} />
                      </TableCell>
                      <TableCell>
                        {g.rsvp ? (
                          <span className="inline-flex items-center gap-1.5">
                            <AttendanceBadge value={g.rsvp.attendance} />
                            {g.rsvp.attendance === "hadir" && (
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {g.rsvp.guest_count} org
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-8 text-[#1a9e4b]"
                            aria-label={`Kirim lewat WhatsApp ke ${g.name}`}
                            title="Kirim lewat WhatsApp"
                          >
                            <a
                              href={waLink(g.phone, message)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => !g.sent_at && markSent(g, true)}
                            >
                              <Send />
                            </a>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi lain">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {gateway && g.phone && (
                                <DropdownMenuItem onSelect={() => sendViaGateway(g)}>
                                  <Zap />
                                  Kirim otomatis
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onSelect={() => copy(guestLink(g.code), "Link")}>
                                <Copy />
                                Salin link undangan
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => copy(message, "Pesan")}>
                                <Copy />
                                Salin pesan
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`${guestLink(g.code)}&preview=1`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink />
                                  Lihat undangannya
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => markSent(g, !g.sent_at)}>
                                {g.sent_at ? <RotateCcw /> : <MailCheck />}
                                {g.sent_at ? "Tandai belum dikirim" : "Tandai sudah dikirim"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setResetting(g)}>
                                <Link2Off />
                                Buat link baru
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setEditing(g);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil />
                                Ubah
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting([g])}>
                                <Trash2 />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>
              {filtered.length} tamu · halaman {current} dari {pageCount}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Halaman sebelumnya"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Halaman berikutnya"
                disabled={current === pageCount}
                onClick={() => setPage(current + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pesan WhatsApp</CardTitle>
          <CardDescription>
            {gateway
              ? "Pengiriman otomatis aktif lewat gateway Fonnte."
              : "Pesan dikirim dengan membuka WhatsApp per tamu. Isi FONNTE_TOKEN di backend untuk kirim otomatis."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="grid content-start gap-2">
            <Label htmlFor="wa-template">Isi pesan</Label>
            <Textarea
              id="wa-template"
              rows={14}
              value={template}
              onChange={(e) => set("wa_template", e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {TEMPLATE_TAGS.map((t) => (
                <code key={t.tag} className="rounded bg-muted px-1.5 py-0.5" title={t.hint}>
                  {t.tag}
                </code>
              ))}
              <span>diganti otomatis per tamu.</span>
              {draft.wa_template && draft.wa_template !== DEFAULT_WA_TEMPLATE && (
                <Button variant="link" size="xs" className="ml-auto" onClick={() => set("wa_template", "")}>
                  Kembalikan bawaan
                </Button>
              )}
            </div>
          </div>
          <div className="grid content-start gap-2">
            <Label className="flex items-center gap-1.5">
              <UserRound className="size-3.5" />
              Pratinjau untuk {preview.name}
            </Label>
            <div className="rounded-lg bg-[#e7ddd3] p-3 dark:bg-[#0b141a]">
              <div className="ml-auto max-w-[90%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-sm whitespace-pre-line break-words text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
                {fillTemplate(template, preview, settings)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />

      <GuestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        guest={editing}
        categories={categories}
        onSaved={load}
      />
      <GuestImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={load} />
      <BroadcastDialog
        open={broadcast !== null}
        onOpenChange={(open) => !open && setBroadcast(null)}
        guests={broadcast ?? []}
        settings={settings}
        template={template}
        gateway={gateway}
        onSent={patchGuest}
      />

      <AlertDialog open={resetting !== null} onOpenChange={(open) => !open && setResetting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buat link baru untuk {resetting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Pakai ini kalau link-nya tersebar ke orang lain. Link lama langsung tidak berlaku, jadi undangan perlu
              dikirim ulang. RSVP yang sudah masuk tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetLink}>Buat link baru</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleting?.length === 1 ? `Hapus ${deleting[0].name}?` : `Hapus ${deleting?.length} tamu?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Link undangan pribadinya tidak akan menampilkan nama lagi. RSVP dan ucapan yang sudah masuk tetap
              tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
