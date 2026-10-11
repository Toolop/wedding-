"use client";

import { ArrowRight, CircleCheck, CircleDashed } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminData } from "@/components/admin/admin-data";
import { AttendanceBadge, formatDateTime } from "@/components/admin/attendance";
import { PageHeader } from "@/components/admin/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminListGallery, adminListStory, adminListWishes } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Settings, WishesResponse } from "@/lib/types";

type Counts = { story: number; gallery: number };

function daysUntil(iso: string) {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(target) - startOfDay(new Date())) / 86_400_000);
}

/** what the invitation still needs; each row links to the page that fixes it */
function checklist(s: Settings, counts: Counts | null) {
  const filled = (...keys: (keyof Settings)[]) => keys.every((k) => String(s[k] ?? "").trim() !== "");
  return [
    { label: "Nama mempelai", done: filled("groom_name", "bride_name", "groom_full_name", "bride_full_name"), href: "/admin/couple" },
    { label: "Orang tua mempelai", done: filled("groom_parents", "bride_parents"), href: "/admin/couple" },
    { label: "Detail akad", done: filled("akad_date", "akad_time", "akad_location", "akad_address"), href: "/admin/event" },
    { label: "Detail resepsi", done: filled("resepsi_date", "resepsi_time", "resepsi_location", "resepsi_address"), href: "/admin/event" },
    { label: "Link Google Maps", done: filled("akad_maps_url", "resepsi_maps_url"), href: "/admin/event" },
    { label: "Foto sampul & pasangan", done: filled("hero_image", "couple_image"), href: "/admin/photos" },
    { label: "Foto galeri", done: counts ? counts.gallery > 0 : null, href: "/admin/photos" },
    { label: "Kisah cinta", done: counts ? counts.story > 0 : null, href: "/admin/story" },
    { label: "Rekening hadiah", done: filled("bank_name", "bank_account_number", "bank_account_name"), href: "/admin/gift" },
  ];
}

export default function OverviewPage() {
  const { settings } = useAdminData();
  const [wishes, setWishes] = useState<WishesResponse | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    Promise.all([adminListWishes(token, 1, 6), adminListStory(token), adminListGallery(token)])
      .then(([w, story, gallery]) => {
        setWishes(w);
        setCounts({ story: story.length, gallery: gallery.length });
      })
      .catch(() => toast.error("Gagal memuat ringkasan"));
  }, []);

  const days = daysUntil(settings.wedding_date);
  const weddingDate = settings.wedding_date
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date(settings.wedding_date))
    : "Belum diatur";
  const items = checklist(settings, counts);
  const done = items.filter((i) => i.done).length;
  const couple = [settings.groom_name, settings.bride_name].filter(Boolean).join(" & ");

  const sum = wishes?.summary;
  const cards = [
    {
      label: "Menuju hari H",
      value: days === null ? "—" : days > 0 ? `${days} hari` : days === 0 ? "Hari ini!" : "Selesai",
      badge: null,
      footer: weddingDate,
    },
    {
      label: "Konfirmasi hadir",
      value: sum?.hadir,
      badge: sum ? `${sum.guests} orang` : null,
      footer: "Jumlah tamu termasuk rombongan",
    },
    {
      label: "Tidak hadir / ragu",
      value: sum ? `${sum.tidak_hadir} / ${sum.masih_ragu}` : undefined,
      badge: null,
      footer: "Berhalangan / belum pasti",
    },
    {
      label: "Total RSVP",
      value: wishes?.total,
      badge: null,
      footer: "Semua ucapan yang masuk",
    },
  ];

  return (
    <>
      <PageHeader
        title={couple ? `Halo, ${couple}` : "Dashboard"}
        description="Ringkasan undangan dan tamu yang sudah konfirmasi."
      />

      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="@container/card">
            <CardHeader>
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {c.value === undefined ? <Skeleton className="h-8 w-16" /> : c.value}
              </CardTitle>
              {c.badge && (
                <CardAction>
                  <Badge variant="outline">{c.badge}</Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardFooter className="text-sm text-muted-foreground">{c.footer}</CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kelengkapan undangan</CardTitle>
            <CardDescription>
              {done} dari {items.length} bagian sudah diisi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${(done / items.length) * 100}%` }}
              />
            </div>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    {item.done === null ? (
                      <Skeleton className="size-4 rounded-full" />
                    ) : item.done ? (
                      <CircleCheck className="size-4 text-emerald-600" />
                    ) : (
                      <CircleDashed className="size-4 text-muted-foreground" />
                    )}
                    <span className={item.done ? "text-muted-foreground" : ""}>{item.label}</span>
                    {item.done === false && <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>RSVP terbaru</CardTitle>
            <CardDescription>Konfirmasi yang paling baru masuk.</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/guests">Lihat semua</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kehadiran</TableHead>
                  <TableHead className="text-right">Tamu</TableHead>
                  <TableHead className="hidden sm:table-cell">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wishes === null ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : wishes.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Belum ada RSVP masuk
                    </TableCell>
                  </TableRow>
                ) : (
                  wishes.items.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell>
                        <AttendanceBadge value={w.attendance} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{w.guest_count}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {formatDateTime(w.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
