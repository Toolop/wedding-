"use client";

import { ArrowLeft, ArrowRight, ImageOff, Images, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminData } from "@/components/admin/admin-data";
import { ConfirmDelete, moveItem } from "@/components/admin/confirm-delete";
import { PageHeader } from "@/components/admin/site-header";
import { UploadButton } from "@/components/admin/upload-button";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminDeleteGalleryImage,
  adminListGallery,
  adminUpdateGalleryImage,
  adminUpload,
  mediaUrl,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { GalleryImage } from "@/lib/types";

function CoverSlot({
  title,
  description,
  image,
  target,
}: {
  title: string;
  description: string;
  image: string;
  target: "hero" | "couple";
}) {
  const { refresh } = useAdminData();
  const [busy, setBusy] = useState(false);

  const upload = async ([file]: File[]) => {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      // the upload endpoint writes the new URL into settings itself
      await adminUpload(token, file, target);
      await refresh();
      toast.success(`${title} diperbarui`);
    } catch {
      toast.error("Gagal mengunggah foto");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <UploadButton label="Ganti" onFiles={upload} busy={busy} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(image)} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <ImageOff className="size-6" />
              Belum ada foto
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CaptionInput({ image, onSaved }: { image: GalleryImage; onSaved: (caption: string) => void }) {
  const [value, setValue] = useState(image.caption);

  const commit = async () => {
    if (value === image.caption) return;
    const token = getToken();
    if (!token) return;
    try {
      await adminUpdateGalleryImage(token, image.id, { caption: value });
      onSaved(value);
      toast.success("Keterangan tersimpan");
    } catch {
      toast.error("Gagal menyimpan keterangan");
    }
  };

  return (
    <Input
      value={value}
      placeholder="Keterangan (opsional)"
      aria-label="Keterangan foto"
      className="h-8 text-sm"
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}

export default function PhotosPage() {
  const { settings } = useAdminData();
  const [gallery, setGallery] = useState<GalleryImage[] | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setGallery(await adminListGallery(token));
    } catch {
      toast.error("Gagal memuat galeri");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  const upload = async (files: File[]) => {
    const token = getToken();
    if (!token) return;
    setUploading(true);
    let failed = 0;
    for (const file of files) {
      try {
        await adminUpload(token, file, "gallery");
      } catch {
        failed++;
      }
    }
    await load();
    setUploading(false);
    if (failed) toast.error(`${failed} foto gagal diunggah`);
    if (files.length > failed) toast.success(`${files.length - failed} foto ditambahkan`);
  };

  const remove = async (id: number) => {
    const token = getToken();
    if (!token || !gallery) return;
    try {
      await adminDeleteGalleryImage(token, id);
      setGallery(gallery.filter((g) => g.id !== id));
      toast.success("Foto dihapus");
    } catch {
      toast.error("Gagal menghapus foto");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const token = getToken();
    if (!token || !gallery) return;
    const result = moveItem(gallery, index, dir);
    if (!result) return;
    const previous = gallery;
    setGallery(result.items);
    try {
      await Promise.all(
        result.changed.map((g) => adminUpdateGalleryImage(token, g.id, { sort_order: g.sort_order }))
      );
    } catch {
      setGallery(previous);
      toast.error("Gagal mengubah urutan");
    }
  };

  return (
    <>
      <PageHeader title="Foto & Galeri" description="JPG, PNG, WEBP, atau GIF. Foto otomatis diperkecil sebelum diunggah." />

      <div className="grid gap-6 md:grid-cols-2">
        <CoverSlot
          title="Foto sampul"
          description="Foto utama di halaman depan undangan."
          image={settings.hero_image}
          target="hero"
        />
        <CoverSlot
          title="Foto pasangan"
          description="Tampil di kartu mempelai."
          image={settings.couple_image}
          target="couple"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Galeri</CardTitle>
          <CardDescription>
            {gallery ? `${gallery.length} foto · ` : ""}Keterangan muncul saat foto dibuka.
          </CardDescription>
          <CardAction>
            <UploadButton label="Tambah foto" multiple onFiles={upload} busy={uploading} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {gallery === null ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-14 text-sm text-muted-foreground">
              <Images className="size-8" />
              Galeri masih kosong
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((img, i) => (
                <div key={img.id} className="space-y-2">
                  <div className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl(img.image_url)}
                      alt={img.caption || `Foto ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-2 top-2 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="size-7"
                          aria-label="Geser ke kiri"
                          disabled={i === 0}
                          onClick={() => move(i, -1)}
                        >
                          <ArrowLeft />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="size-7"
                          aria-label="Geser ke kanan"
                          disabled={i === gallery.length - 1}
                          onClick={() => move(i, 1)}
                        >
                          <ArrowRight />
                        </Button>
                      </div>
                      <ConfirmDelete title="Hapus foto ini dari galeri?" onConfirm={() => remove(img.id)}>
                        <Button size="icon" variant="destructive" className="size-7" aria-label="Hapus foto">
                          <Trash2 />
                        </Button>
                      </ConfirmDelete>
                    </div>
                  </div>
                  <CaptionInput
                    image={img}
                    onSaved={(caption) =>
                      setGallery((prev) => prev && prev.map((g) => (g.id === img.id ? { ...g, caption } : g)))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
