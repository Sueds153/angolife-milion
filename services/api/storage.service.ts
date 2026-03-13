/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";

export const StorageService = {
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
    } catch (err) {
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
