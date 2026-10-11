"use client";

import { Crop, LoaderCircle, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cropImage, type CropArea } from "@/lib/crop-image";

// mirrors the backend's allow-list
const ACCEPT = ".jpg,.jpeg,.png,.webp,.gif";
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Pick a photo, frame it in a crop dialog, then hand the cropped JPEG to
 * `onCropped`. The dialog stays open (and shows a spinner) until the promise
 * settles, so a failed upload can simply be retried.
 */
export function CropUploadButton({
  label,
  title,
  aspect = 1,
  round,
  onCropped,
}: {
  label: string;
  title: string;
  aspect?: number;
  /** show a circular frame (the crop itself is still rectangular) */
  round?: boolean;
  onCropped: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropArea | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URL lives as long as the picked file
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const close = () => {
    if (busy) return;
    setFile(null);
    setSrc(null);
  };

  const confirm = async () => {
    if (!file || !area) return;
    setBusy(true);
    try {
      let cropped: File;
      try {
        cropped = await cropImage(file, area);
      } catch {
        toast.error("Gagal memotong foto");
        return;
      }
      await onCropped(cropped);
      setFile(null);
      setSrc(null);
    } catch {
      // onCropped reports its own errors; keep the dialog open for a retry
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (!picked) return;
          if (!picked.type.startsWith("image/")) {
            toast.error("File harus berupa gambar");
            return;
          }
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setArea(null);
          setFile(picked);
        }}
      />
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload />
        {label}
      </Button>

      <Dialog open={!!file} onOpenChange={(open) => !open && close()}>
        <DialogContent showCloseButton={!busy} onInteractOutside={(e) => busy && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Geser untuk mengatur posisi, cubit atau gunakan slider untuk zoom.</DialogDescription>
          </DialogHeader>

          <div className="relative h-72 overflow-hidden rounded-lg bg-muted sm:h-80">
            {src && (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                aspect={aspect}
                cropShape={round ? "round" : "rect"}
                showGrid={!round}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setArea(pixels)}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-primary"
            />
            <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={busy}>
              Batal
            </Button>
            <Button onClick={confirm} disabled={busy || !area}>
              {busy ? <LoaderCircle className="animate-spin" /> : <Crop />}
              {busy ? "Mengunggah..." : "Potong & simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
