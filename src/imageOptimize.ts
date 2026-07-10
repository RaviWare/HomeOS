/**
 * Client-side image optimization for Property Hub covers.
 * Resizes + re-encodes to JPEG so localStorage / dashboard stays fast.
 */

export interface OptimizeOptions {
  /** Max long-edge in px (default 1280) */
  maxEdge?: number;
  /** JPEG quality 0–1 (default 0.74) */
  quality?: number;
  /** Soft target size in bytes; quality is reduced until under (default 180KB) */
  maxBytes?: number;
  /** Output type (default image/jpeg) */
  mime?: "image/jpeg" | "image/webp";
}

const DEFAULTS: Required<OptimizeOptions> = {
  maxEdge: 1280,
  quality: 0.74,
  maxBytes: 180 * 1024,
  mime: "image/jpeg",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image."));
    img.src = src;
  });
}

function drawToCanvas(
  img: HTMLImageElement | ImageBitmap,
  maxEdge: number
): HTMLCanvasElement {
  const w = "naturalWidth" in img ? img.naturalWidth : img.width;
  const h = "naturalHeight" in img ? img.naturalHeight : img.height;
  let tw = w;
  let th = h;
  const long = Math.max(w, h);
  if (long > maxEdge) {
    const scale = maxEdge / long;
    tw = Math.round(w * scale);
    th = Math.round(h * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, tw);
  canvas.height = Math.max(1, th);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img as CanvasImageSource, 0, 0, tw, th);
  return canvas;
}

function canvasToDataUrl(canvas: HTMLCanvasElement, mime: string, quality: number): string {
  return canvas.toDataURL(mime, quality);
}

function dataUrlBytes(dataUrl: string): number {
  // Approximate: base64 is ~4/3 of binary
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  return Math.ceil((b64.length * 3) / 4);
}

/**
 * Optimize a user-selected File into a compact data URL (JPEG/WebP).
 * Safe for localStorage and list rendering (lazy + small payload).
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeOptions = {}
): Promise<{ dataUrl: string; bytes: number; width: number; height: number }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, or WebP).");
  }
  // Hard reject absurd uploads before decode
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("Image is too large (max 25 MB before optimization).");
  }

  const opts = { ...DEFAULTS, ...options };
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const canvas = drawToCanvas(img, opts.maxEdge);

    let quality = opts.quality;
    let dataUrl = canvasToDataUrl(canvas, opts.mime, quality);
    let bytes = dataUrlBytes(dataUrl);

    // Step quality down until under maxBytes (or floor)
    while (bytes > opts.maxBytes && quality > 0.45) {
      quality = Math.max(0.45, quality - 0.08);
      dataUrl = canvasToDataUrl(canvas, opts.mime, quality);
      bytes = dataUrlBytes(dataUrl);
    }

    // If still huge, shrink edge further
    if (bytes > opts.maxBytes) {
      const smaller = drawToCanvas(img, Math.round(opts.maxEdge * 0.7));
      quality = 0.68;
      dataUrl = canvasToDataUrl(smaller, opts.mime, quality);
      bytes = dataUrlBytes(dataUrl);
      while (bytes > opts.maxBytes && quality > 0.4) {
        quality = Math.max(0.4, quality - 0.08);
        dataUrl = canvasToDataUrl(smaller, opts.mime, quality);
        bytes = dataUrlBytes(dataUrl);
      }
      return {
        dataUrl,
        bytes,
        width: smaller.width,
        height: smaller.height,
      };
    }

    return {
      dataUrl,
      bytes,
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Human-readable size */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Default cover when no upload */
export const DEFAULT_PROPERTY_COVER =
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=640&auto=format&fit=crop&q=60";
