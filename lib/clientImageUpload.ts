const BASE64_PREFIX = ";base64,";

export const MAX_UPLOAD_IMAGE_FILE_SIZE_BYTES = 2_500_000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("invalid"));
    reader.onerror = () => reject(reader.error ?? new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function scaleSize(width: number, height: number, maxDimension: number): [number, number] {
  const maxSide = Math.max(width, height);
  if (maxSide <= maxDimension) return [Math.round(width), Math.round(height)];
  const ratio = maxDimension / maxSide;
  return [Math.max(1, Math.round(width * ratio)), Math.max(1, Math.round(height * ratio))];
}

export function estimateImageStringBytes(value: string): number {
  if (!value.startsWith("data:")) {
    return new TextEncoder().encode(value).length;
  }

  const base64Index = value.indexOf(BASE64_PREFIX);
  if (base64Index === -1) {
    return new TextEncoder().encode(value).length;
  }

  const base64Payload = value.slice(base64Index + BASE64_PREFIX.length);
  const padding = base64Payload.endsWith("==") ? 2 : base64Payload.endsWith("=") ? 1 : 0;
  return Math.floor((base64Payload.length * 3) / 4) - padding;
}

export function validateUploadImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return `File "${file.name}" bukan gambar.`;
  }

  if (file.size > MAX_UPLOAD_IMAGE_FILE_SIZE_BYTES) {
    return `Ukuran "${file.name}" terlalu besar. Maksimal 2.5 MB per gambar.`;
  }

  return null;
}

export async function fileToOptimizedDataUrl(
  file: File,
  options?: { maxBytes?: number; maxDimension?: number }
): Promise<string> {
  const maxBytes = options?.maxBytes ?? 260_000;
  const maxDimension = options?.maxDimension ?? 1440;

  // Keep SVG/GIF as-is to avoid changing vector/animation behavior.
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return readFileAsDataUrl(file);
  }

  const bitmap = await createImageBitmap(file);
  try {
    const [baseWidth, baseHeight] = scaleSize(bitmap.width, bitmap.height, maxDimension);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return readFileAsDataUrl(file);
    }

    let width = baseWidth;
    let height = baseHeight;
    let smallestDataUrl = "";
    let smallestBytes = Number.POSITIVE_INFINITY;

    for (let resizeStep = 0; resizeStep < 5; resizeStep += 1) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      for (let quality = 0.9; quality >= 0.45; quality -= 0.1) {
        const dataUrl = canvas.toDataURL("image/webp", Number(quality.toFixed(2)));
        const bytes = estimateImageStringBytes(dataUrl);

        if (bytes < smallestBytes) {
          smallestBytes = bytes;
          smallestDataUrl = dataUrl;
        }

        if (bytes <= maxBytes) {
          return dataUrl;
        }
      }

      width = Math.max(1, Math.round(width * 0.84));
      height = Math.max(1, Math.round(height * 0.84));
    }

    return smallestDataUrl || readFileAsDataUrl(file);
  } finally {
    bitmap.close();
  }
}
