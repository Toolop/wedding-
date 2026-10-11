"use client";

import { LoaderCircle, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resizeImage } from "@/lib/resize-image";

// mirrors the backend's allow-list
const ACCEPT = ".jpg,.jpeg,.png,.webp,.gif";
// Vercel rejects request bodies over ~4.5MB; photos are resized well under this first
const MAX_BYTES = 4 * 1024 * 1024;

export function UploadButton({
  label,
  multiple,
  onFiles,
  busy,
}: {
  label: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={async (e) => {
          const picked = Array.from(e.target.files ?? []);
          e.target.value = "";
          const files = await Promise.all(picked.map(resizeImage));
          const tooBig = files.filter((f) => f.size > MAX_BYTES);
          if (tooBig.length) toast.error(`${tooBig.map((f) => f.name).join(", ")} masih lebih dari 4MB`);
          const ok = files.filter((f) => f.size <= MAX_BYTES);
          if (ok.length) onFiles(ok);
        }}
      />
      <Button variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? <LoaderCircle className="animate-spin" /> : <Upload />}
        {busy ? "Mengunggah..." : label}
      </Button>
    </>
  );
}
