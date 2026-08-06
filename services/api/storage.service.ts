/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";

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
    const fileName = `ads/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    // Try list of known public buckets in Supabase
    const bucketsToTry = ['ads', 'discount-images', 'avatars', 'exchange-proofs', 'payment-receipts'];

    for (const bucketName of bucketsToTry) {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

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
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const { data, error } = await supabase.storage
        .from("discount-images")
        .upload(fileName, file, {
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
    const { error } = await supabase.storage.from("payment-receipts").upload(filePath, file);
    if (error) return null;
    return supabase.storage.from("payment-receipts").getPublicUrl(filePath).data.publicUrl;
  },

  uploadAvatar: async (file: File): Promise<string | null> => {
    const fileName = `${Math.random()}.${file.name.split(".").pop()}`;
    const filePath = `avatars/${fileName}`;
    const { error } = await supabase.storage.from("avatars").upload(filePath, file);
    if (error) return null;
    return supabase.storage.from("avatars").getPublicUrl(filePath).data.publicUrl;
  },
};
