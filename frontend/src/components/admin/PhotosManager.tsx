"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { adminUpload, mediaUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Settings } from "@/lib/types";

function PhotoSlot({
  label,
  imageUrl,
  target,
  onUploaded,
}: {
  label: string;
  imageUrl: string;
  target: "hero" | "couple";
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    const token = getToken();
    if (!token) return;
    setUploading(true);
    try {
      const res = await adminUpload(token, file, target);
      onUploaded(res.url);
      toast.success(`${label} berhasil diperbarui`);
    } catch {
      toast.error("Gagal mengunggah foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="font-heading text-lg font-semibold text-[#8b7355]">{label}</h3>
      <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl bg-[#f5f0e8]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(imageUrl)}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#8b7355]/40">
            Belum ada foto
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-4 flex items-center gap-2 rounded-full bg-[#c9a876] px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Mengunggah..." : "Ganti Foto"}
      </button>
    </div>
  );
}

export default function PhotosManager({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <PhotoSlot
        label="Foto Hero (Sampul)"
        imageUrl={settings.hero_image}
        target="hero"
        onUploaded={(url) => onChange({ hero_image: url })}
      />
      <PhotoSlot
        label="Foto Pasangan"
        imageUrl={settings.couple_image}
        target="couple"
        onUploaded={(url) => onChange({ couple_image: url })}
      />
    </div>
  );
}
