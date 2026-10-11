"use client";

import { BadgeCheck, CircleDashed, ExternalLink, ReceiptText, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/components/admin/attendance";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { PageHeader } from "@/components/admin/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminDeleteGiftConfirmation,
  adminListGiftConfirmations,
  adminSetGiftVerified,
  mediaUrl,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { GiftConfirmation } from "@/lib/types";

type Filter = "all" | "pending" | "verified";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function StatusBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge variant="outline" className="gap-1 border-emerald-500/40 px-1.5 text-emerald-700 dark:text-emerald-400">
      <BadgeCheck className="size-3" />
      Terverifikasi
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 px-1.5 text-amber-700 dark:text-amber-400">
      <CircleDashed className="size-3" />
      Belum dicek
    </Badge>
  );
}

export default function GiftConfirmationsPage() {
  const [items, setItems] = useState<GiftConfirmation[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [viewing, setViewing] = useState<GiftConfirmation | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    adminListGiftConfirmations(token)
      .then(setItems)
      .catch(() => toast.error("Gagal memuat konfirmasi"));
  }, []);

  const stats = useMemo(() => {
    const all = items ?? [];
    const verified = all.filter((i) => i.verified);
    return {
      total: all.length,
      pending: all.length - verified.length,
      verified: verified.length,
      amount: verified.reduce((sum, i) => sum + (i.amount || 0), 0),
    };
  }, [items]);

  const rows = useMemo(
    () =>
      (items ?? []).filter(
        (i) => filter === "all" || (filter === "verified" ? i.verified : !i.verified)
      ),
    [items, filter]
  );

  const setVerified = async (item: GiftConfirmation, verified: boolean) => {
    const token = getToken();
    if (!token) return;
    const patch = (v: boolean) => (list: GiftConfirmation[] | null) =>
      list && list.map((i) => (i.id === item.id ? { ...i, verified: v } : i));
    setItems(patch(verified));
    setViewing((v) => (v && v.id === item.id ? { ...v, verified } : v));
    try {
      await adminSetGiftVerified(token, item.id, verified);
      toast.success(verified ? "Ditandai terverifikasi" : "Ditandai belum dicek");
    } catch {
      setItems(patch(!verified));
      setViewing((v) => (v && v.id === item.id ? { ...v, verified: !verified } : v));
      toast.error("Gagal mengubah status");
    }
  };

  const remove = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await adminDeleteGiftConfirmation(token, id);
      setItems((prev) => prev && prev.filter((i) => i.id !== id));
      setViewing(null);
      toast.success("Konfirmasi dihapus");
    } catch {
      toast.error("Gagal menghapus konfirmasi");
    }
  };

  const STAT_CARDS = [
    { label: "Belum dicek", value: stats.pending, note: "Perlu dicocokkan dengan mutasi" },
    { label: "Terverifikasi", value: stats.verified, note: "Sudah masuk rekening" },
    { label: "Total terverifikasi", value: rupiah(stats.amount), note: "Dari nominal yang diisi tamu" },
    { label: "Semua konfirmasi", value: stats.total, note: "Bukti transfer yang diunggah" },
  ];

  return (
    <>
      <PageHeader title="Konfirmasi Hadiah" description="Bukti transfer yang diunggah tamu dari kartu hadiah." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <Card key={s.label} className="gap-1 py-4">
            <CardHeader className="px-4">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {items ? s.value : <Skeleton className="h-8 w-12" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 text-xs text-muted-foreground">{s.note}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between gap-2 border-b p-4">
          <p className="text-sm text-muted-foreground">Klik kartu untuk melihat bukti lebih besar.</p>
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="w-44" aria-label="Filter status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="pending">Belum dicek</SelectItem>
              <SelectItem value="verified">Terverifikasi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CardContent className="p-4">
          {items === null ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center text-sm text-muted-foreground">
              <ReceiptText className="size-8" />
              {items.length === 0 ? "Belum ada konfirmasi hadiah" : "Tidak ada yang cocok dengan filter"}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((item) => (
                <div key={item.id} className="flex flex-col overflow-hidden rounded-lg border bg-card">
                  <button
                    onClick={() => setViewing(item)}
                    className="aspect-[4/3] overflow-hidden bg-muted"
                    aria-label={`Lihat bukti dari ${item.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl(item.proof_url)}
                      alt={`Bukti transfer ${item.name}`}
                      className="h-full w-full object-cover object-top transition-transform hover:scale-105"
                    />
                  </button>
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-tight">{item.name}</p>
                      <StatusBadge verified={item.verified} />
                    </div>
                    <p className="text-lg font-semibold tabular-nums">
                      {item.amount ? rupiah(item.amount) : <span className="text-sm font-normal text-muted-foreground">Nominal tidak diisi</span>}
                    </p>
                    {item.account_label && <p className="text-xs text-muted-foreground">Ke {item.account_label}</p>}
                    {item.message && <p className="line-clamp-2 text-sm text-muted-foreground">“{item.message}”</p>}
                    <p className="mt-auto pt-1 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant={item.verified ? "outline" : "default"}
                        className="flex-1"
                        onClick={() => setVerified(item, !item.verified)}
                      >
                        {item.verified ? "Batalkan verifikasi" : "Tandai terverifikasi"}
                      </Button>
                      <ConfirmDelete
                        title={`Hapus konfirmasi dari ${item.name}?`}
                        onConfirm={() => remove(item.id)}
                      >
                        <Button size="sm" variant="ghost" className="text-destructive" aria-label="Hapus">
                          <Trash2 />
                        </Button>
                      </ConfirmDelete>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {viewing.name}
                  <StatusBadge verified={viewing.verified} />
                </DialogTitle>
                <DialogDescription>
                  {[viewing.amount ? rupiah(viewing.amount) : "", viewing.account_label, formatDateTime(viewing.created_at)]
                    .filter(Boolean)
                    .join(" · ")}
                </DialogDescription>
              </DialogHeader>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(viewing.proof_url)}
                alt={`Bukti transfer ${viewing.name}`}
                className="max-h-[60vh] w-full rounded-md border object-contain"
              />
              {viewing.message && <p className="text-sm text-muted-foreground">“{viewing.message}”</p>}
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" asChild>
                  <a href={mediaUrl(viewing.proof_url)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Buka gambar asli
                  </a>
                </Button>
                <Button
                  variant={viewing.verified ? "outline" : "default"}
                  onClick={() => setVerified(viewing, !viewing.verified)}
                >
                  {viewing.verified ? "Batalkan verifikasi" : "Tandai terverifikasi"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
