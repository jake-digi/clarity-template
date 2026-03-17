import { supabase } from "@/integrations/supabase/client";

const PRODUCT_IMAGE_BUCKET = "freemans-storage-bucket";

const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";

/**
 * Resolve product image_url to a display URL.
 * - Missing/empty → placeholder data URI
 * - Starts with http(s) → as-is
 * - Else → Supabase storage public URL (optional transform for thumbnails)
 */
export function getProductImageUrl(
  path: string | null | undefined,
  options?: { width?: number; height?: number }
): string {
  if (!path || typeof path !== "string" || !path.trim()) {
    return PLACEHOLDER_SVG;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  let url = data.publicUrl;
  if (options?.width || options?.height) {
    url = url.replace("/object/public/", "/render/image/public/");
    const params = new URLSearchParams();
    if (options.width) params.set("width", String(options.width));
    if (options.height) params.set("height", String(options.height));
    params.set("resize", "contain");
    params.set("quality", "60");
    url += (url.includes("?") ? "&" : "?") + params.toString();
  }
  return url;
}
