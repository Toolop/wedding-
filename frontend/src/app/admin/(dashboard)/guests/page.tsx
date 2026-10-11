"use client";

import { ChevronLeft, ChevronRight, Download, MessageSquareHeart, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ATTENDANCE, AttendanceBadge, formatDateTime } from "@/components/admin/attendance";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { PageHeader } from "@/components/admin/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminDeleteWish, adminListAllWishes } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Attendance, Wish } from "@/lib/types";

const PAGE_SIZE = 15;

function downloadCsv(rows: Wish[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ["Nama", "Kehadiran", "Jumlah tamu", "Ucapan", "Waktu"].map(esc).join(","),
    ...rows.map((w) =>
      [w.name, ATTENDANCE[w.attendance]?.label ?? w.attendance, w.guest_count, w.message, formatDateTime(w.created_at)]
        .map(esc)
        .join(",")
    ),
  ];
  // BOM so Excel reads the UTF-8 names correctly
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rsvp-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GuestsPage() {
  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Attendance | "all">("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    adminListAllWishes(token)
      .then(setWishes)
      .catch(() => toast.error("Gagal memuat RSVP"));
  }, []);

  const stats = useMemo(() => {
    const all = wishes ?? [];
    const coming = all.filter((w) => w.attendance === "hadir");
    return {
      total: all.length,
      hadir: coming.length,
      guests: coming.reduce((sum, w) => sum + (w.guest_count || 0), 0),
      tidak_hadir: all.filter((w) => w.attendance === "tidak_hadir").length,
      masih_ragu: all.filter((w) => w.attendance === "masih_ragu").length,
    };
  }, [wishes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (wishes ?? []).filter(
      (w) =>
        (filter === "all" || w.attendance === filter) &&
        (!q || w.name.toLowerCase().includes(q) || w.message.toLowerCase().includes(q))
    );
  }, [wishes, query, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const remove = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await adminDeleteWish(token, id);
      setWishes((prev) => prev && prev.filter((w) => w.id !== id));
      toast.success("RSVP dihapus");
    } catch {
      toast.error("Gagal menghapus RSVP");
    }
  };

  const STAT_CARDS = [
    { label: "Hadir", value: stats.hadir, note: `${stats.guests} orang termasuk rombongan` },
    { label: "Tidak hadir", value: stats.tidak_hadir, note: "Berhalangan datang" },
    { label: "Masih ragu", value: stats.masih_ragu, note: "Belum pasti" },
    { label: "Total RSVP", value: stats.total, note: "Semua ucapan masuk" },
  ];

  return (
    <>
      <PageHeader title="RSVP & Ucapan" description="Konfirmasi kehadiran dan ucapan dari tamu.">
        <Button variant="outline" disabled={!wishes?.length} onClick={() => downloadCsv(filtered)}>
          <Download />
          Ekspor CSV
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <Card key={s.label} className="gap-1 py-4">
            <CardHeader className="px-4">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {wishes ? s.value : <Skeleton className="h-8 w-12" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 text-xs text-muted-foreground">{s.note}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau ucapan..."
              aria-label="Cari"
              className="pl-8"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v as Attendance | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-44" aria-label="Filter kehadiran">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kehadiran</SelectItem>
              {(Object.keys(ATTENDANCE) as Attendance[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {ATTENDANCE[k].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-4">Nama</TableHead>
                <TableHead>Kehadiran</TableHead>
                <TableHead className="text-right">Tamu</TableHead>
                <TableHead className="min-w-64">Ucapan</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead className="w-12 pr-4">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wishes === null ? (
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
                    <MessageSquareHeart className="mx-auto mb-2 size-8" />
                    {wishes.length === 0 ? "Belum ada RSVP masuk" : "Tidak ada yang cocok dengan pencarian"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="pl-4 font-medium">{w.name}</TableCell>
                    <TableCell>
                      <AttendanceBadge value={w.attendance} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{w.guest_count}</TableCell>
                    <TableCell className="max-w-md whitespace-normal text-muted-foreground">
                      <p className="line-clamp-2">{w.message || "—"}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(w.created_at)}</TableCell>
                    <TableCell className="pr-4">
                      <ConfirmDelete
                        title={`Hapus RSVP dari ${w.name}?`}
                        description="Ucapan ini juga akan hilang dari undangan."
                        onConfirm={() => remove(w.id)}
                      >
                        <Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label="Hapus">
                          <Trash2 />
                        </Button>
                      </ConfirmDelete>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>
              {filtered.length} RSVP · halaman {current} dari {pageCount}
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
    </>
  );
}
