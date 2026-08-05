/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";

export const StorageService = {
  uploadAdMedia: async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const fileName = `ads/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      // Try uploading to 'ads' bucket, or fallback to 'public' or 'discount-images'
      const bucketName = 'ads';
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data.path);
        return publicUrl;
      }

      // Fallback attempt to discount-images bucket
      const { data: fallbackData, error: fallbackError } = await supabase.storage
        .from('discount-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (!fallbackError && fallbackData) {
        const { data: { publicUrl } } = supabase.storage.from('discount-images').getPublicUrl(fallbackData.path);
        return publicUrl;
      }

      // Final fallback: Convert small file to Data URL base64 so it never fails!
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error('[StorageService] uploadAdMedia error:', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
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
