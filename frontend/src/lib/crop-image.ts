export type CropArea = { x: number; y: number; width: number; height: number };

const QUALITY = 0.9;

/**
 * Cut `area` (in source-image pixels) out of `file` and scale it so its
 * longest side is at most `maxSide`. Always returns a JPEG, which keeps
 * portraits small enough for the hosted API.
 */
export async function cropImage(file: File, area: CropArea, maxSide = 900): Promise<File> {
  // respects EXIF orientation, matching what the cropper preview showed
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(area.width, area.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas unavailable");
  }
  // JPEG has no transparency; paint a white backdrop for PNGs
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) throw new Error("crop failed");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
