/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";
import { uploadViaR2, r2Configured } from "./r2";

/** Resize and compress an image file to a lightweight data URL fallback (<150KB) */
const compressImageToDataUrl = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1000;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve((e.target?.result as string) || null);
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

export const StorageService = {
  uploadAdMedia: async (file: File): Promise<string | null> => {
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|avi|mkv)$/i);
    const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const key = `ads/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    // Prefer Cloudflare R2 (public media bucket)
    const r2Url = await uploadViaR2(key, file);
    if (r2Url) return r2Url;

    if (r2Configured()) {
      // R2 is configured but upload failed — do not fall through to Supabase
      if (!isVideo) return await compressImageToDataUrl(file);
      return null;
    }

    // Legacy fallback: Supabase public buckets
    const bucketsToTry = ['ads', 'discount-images', 'avatars', 'exchange-proofs', 'payment-receipts'];

    for (const bucketName of bucketsToTry) {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(key, file, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data.path);
          if (publicUrl) return publicUrl;
        }
      } catch {
        // Bucket try failed, continue to next fallback
      }
    }

    // ── Fallbacks if Supabase Storage buckets are not configured ──
    if (!isVideo) {
      // For images: compress & resize with canvas so it never hangs or breaks payload size!
      return await compressImageToDataUrl(file);
    }

    // For videos: multi-MB base64 strings crash Supabase DB payload. Return null to alert user.
    return null;
  },

  uploadDiscountImage: async (file: File): Promise<string | null> => {
    try {
      const name = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const key = `discount-images/${name}`;

      const r2Url = await uploadViaR2(key, file);
      if (r2Url) return r2Url;
      if (r2Configured()) return null;

      const { data, error } = await supabase.storage
        .from("discount-images")
        .upload(name, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) return null;

      const { data: { publicUrl } } = supabase.storage
        .from("discount-images")
        .getPublicUrl(data.path);

      return publicUrl;
    } catch {
      return null;
    }
  },

  uploadProof: async (file: File): Promise<string | null> => {
    const fileName = `${Math.random()}.${file.name.split(".").pop()}`;
    const filePath = `proofs/${fileName}`;
    const { error } = await supabase.storage.from("exchange-proofs").upload(filePath, file);
    if (error) return null;
    return supabase.storage.from("exchange-proofs").getPublicUrl(filePath).data.publicUrl;
  },

  uploadReceipt: async (file: File): Promise<string | null> => {
    const fileName = `${Math.random()}.${file.name.split(".").pop()}`;
    const filePath = `receipts/${fileName}`;
    const { data, error } = await supabase.storage
      .from("payment-receipts")
      .upload(filePath, file);

    if (!error && data) {
      return supabase.storage.from("payment-receipts").getPublicUrl(data.path).data.publicUrl;
    }

    console.warn('[StorageService] payment-receipts bucket upload failed, using fallback:', error?.message);

    // Fallback: comprimir imagem para base64 se o bucket falhar
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      return await compressImageToDataUrl(file);
    }

    // PDFs: tentar outros buckets
    const bucketsToTry = ['exchange-proofs', 'avatars'];
    for (const bucketName of bucketsToTry) {
      try {
        const { data: d, error: e } = await supabase.storage
          .from(bucketName)
          .upload(`receipts/${fileName}`, file, { upsert: true });
        if (!e && d) {
          return supabase.storage.from(bucketName).getPublicUrl(d.path).data.publicUrl;
        }
      } catch {
        // continua para o próximo bucket
      }
    }

    return null;
  },

  uploadAvatar: async (file: File): Promise<string | null> => {
    const key = `avatars/${Math.random()}.${file.name.split(".").pop()}`;

    const r2Url = await uploadViaR2(key, file);
    if (r2Url) return r2Url;
    if (r2Configured()) return null;

    const { error } = await supabase.storage.from("avatars").upload(key, file);
    if (error) return null;
    return supabase.storage.from("avatars").getPublicUrl(key).data.publicUrl;
  },
};
