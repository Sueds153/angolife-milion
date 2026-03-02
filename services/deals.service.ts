/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "./supabaseClient";
import { ProductDeal } from "../types";
import { ServiceUtils } from "./utils";

export const DealsService = {
  getDeals: async (isAdmin: boolean = false): Promise<ProductDeal[]> => {
    let query = supabase.from("product_deals").select("*");

    if (!isAdmin) {
      query = query.or(
        "status.eq.approved,status.eq.aprovado,status.eq.publicado,status.eq.published",
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching deals:", error);
      return [];
    }

    return data.map((d: any) => ({
      ...d,
      id: d.id,
      title: d.title,
      store: d.store,
      originalPrice: d.original_price,
      discountPrice: d.discount_price,
      location: d.location,
      description: d.description,
      imagePlaceholder: d.image_placeholder,
      url: d.url,
      category: d.category,
      status: ServiceUtils.mapStatus(d.status) === "published" ? "approved" : (ServiceUtils.mapStatus(d.status) as any),
      submittedBy: d.submitted_by,
      createdAt: d.created_at,
    }));
  },

  getPendingDeals: async (): Promise<ProductDeal[]> => {
    const { data, error } = await supabase
      .from("product_deals")
      .select("*")
      .or(
        "status.eq.pending,status.eq.Pending,status.eq.pendente,status.eq.Pendente",
      );

    if (error) {
      console.error("❌ [Supabase] Error fetching pending deals:", error);
      return [];
    }

    return data.map((d: any) => ({
      ...d,
      id: d.id,
      title: d.title,
      store: d.store,
      originalPrice: d.original_price,
      discountPrice: d.discount_price,
      location: d.location,
      description: d.description,
      imagePlaceholder: d.image_placeholder,
      url: d.url,
      category: d.category,
      status: "pending",
      submittedBy: d.submitted_by,
      createdAt: d.created_at,
    }));
  },

  submitDeal: async (
    deal: Omit<ProductDeal, "id" | "status" | "createdAt">,
  ): Promise<void> => {
    const { error } = await supabase.from("product_deals").insert([
      {
        title: deal.title,
        store: deal.store,
        original_price: deal.originalPrice,
        discount_price: deal.discountPrice,
        location: deal.location,
        description: deal.description,
        image_placeholder: deal.imagePlaceholder,
        category: deal.category,
        submitted_by: deal.submittedBy,
        status: "pending",
      },
    ]);

    if (error) console.error("Error submitting deal:", error);
  },

  approveDeal: async (id: string, isApproved: boolean): Promise<void> => {
    const status = isApproved ? "approved" : "rejected";
    const { error } = await supabase
      .from("product_deals")
      .update({ status })
      .eq("id", id);

    if (error) console.error("Error approving deal:", error);
  },

  getDealById: async (id: string): Promise<ProductDeal | null> => {
    const { data, error } = await supabase
      .from("product_deals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Error fetching deal by id:", error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      store: data.store,
      storeNumber: data.store_number,
      phone: data.phone,
      originalPrice: data.original_price,
      discountPrice: data.discount_price,
      price: data.discount_price,
      location: data.location,
      description: data.description,
      imagePlaceholder: data.image_placeholder,
      imageUrl: data.image_url,
      url: data.url,
      category: data.category,
      status: ServiceUtils.mapStatus(data.status) === "published" ? "approved" : (ServiceUtils.mapStatus(data.status) as any),
      submittedBy: data.submitted_by,
      createdAt: data.created_at,
      views: data.views ?? 0,
      likes: data.likes ?? 0,
      verified: data.verified ?? false,
      is_admin: data.is_admin ?? false,
    };
  },

  incrementDealViews: async (id: string): Promise<void> => {
    const { data, error: fetchError } = await supabase
      .from("product_deals")
      .select("views")
      .eq("id", id)
      .single();

    if (fetchError || !data) return;

    await supabase
      .from("product_deals")
      .update({ views: (data.views ?? 0) + 1 })
      .eq("id", id);
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

      if (error) {
        console.error("Error uploading discount image:", error);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("discount-images").getPublicUrl(data.path);

      return publicUrl;
    } catch (err) {
      console.error("Unexpected error during upload:", err);
      return null;
    }
  },
};
