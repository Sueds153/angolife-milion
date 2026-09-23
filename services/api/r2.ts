/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";

const R2_PUBLIC = (import.meta.env.VITE_R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");

/** Public URL for a key in the R2 bucket (full key, e.g. `ads/123.jpg`). */
export const r2PublicUrl = (key: string): string =>
  R2_PUBLIC ? `${R2_PUBLIC}/${key.replace(/^\/+/, "")}` : "";

export const r2Configured = (): boolean => Boolean(R2_PUBLIC);

type SignResponse = { url?: string; key?: string; error?: string };

/**
 * Ask the `r2-sign-upload` edge function for a presigned PUT URL,
 * then upload the file to R2 and return its public URL.
 * Returns null on any failure (caller falls back).
 */
export const uploadViaR2 = async (
  key: string,
  file: File | Blob,
  contentType?: string,
): Promise<string | null> => {
  if (!r2Configured()) return null;
  try {
    const { data, error } = await supabase.functions.invoke("r2-sign-upload", {
      body: { key, contentType: contentType || (file as File).type || "application/octet-stream" },
    });
    if (error) {
      console.warn("[r2] sign error:", error.message);
      return null;
    }
    const res = data as SignResponse;
    if (!res?.url) {
      console.warn("[r2] no signed url:", res?.error);
      return null;
    }
    const put = await fetch(res.url, {
      method: "PUT",
      headers: { "Content-Type": contentType || (file as File).type || "application/octet-stream" },
      body: file,
    });
    if (!put.ok) {
      console.warn("[r2] PUT failed:", put.status);
      return null;
    }
    return r2PublicUrl(res.key || key);
  } catch (err) {
    console.warn("[r2] upload exception:", err);
    return null;
  }
};
