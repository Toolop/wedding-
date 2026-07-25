"use client";

import { Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  adminDeleteGalleryImage,
  adminListGallery,
  adminUpload,
  mediaUrl,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { GalleryImage } from "@/lib/types";

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const token = getToken();
    if (!token) return;
    setItems(await adminListGallery(token));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  const handleFiles = async (files: FileList) => {
    const token = getToken();
    if (!token) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await adminUpload(token, file, "gallery");
      }
      await load();
      toast.success("Foto berhasil ditambahkan");
    } catch {
      toast.error("Gagal mengunggah foto");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await adminDeleteGalleryImage(token, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Gagal menghapus foto");
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 rounded-full bg-[#c9a876] px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Mengunggah..." : "Tambah Foto"}
      </button>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(img.image_url)}
              alt={img.caption || "Gallery"}
              className="h-full w-full object-cover"
            />
            <button
              onClick={() => remove(img.id)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
