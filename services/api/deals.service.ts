/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";
import { ProductDeal } from "../../types";
import { ServiceUtils } from "../utils/utils";

interface DealRow {
  id: string;
  title: string;
  store: string;
  store_number?: string;
  phone?: string;
  original_price: number;
  discount_price: number;
  location: string;
  description: string;
  image_placeholder: string;
  image_url?: string;
  url?: string;
  category?: string;
  status: string;
  submitted_by: string;
  created_at: string;
  views?: number;
  likes?: number;
  verified?: boolean;
  is_admin?: boolean;
}

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

    return data.map((d: DealRow): ProductDeal => {
      const mappedStatus = ServiceUtils.mapStatus(d.status);
      return {
        ...d,
        id: d.id,
        title: d.title,
        store: d.store,
        storeNumber: d.store_number,
        phone: d.phone,
        originalPrice: d.original_price,
        discountPrice: d.discount_price,
        price: d.discount_price,
        location: d.location,
        description: d.description,
        imagePlaceholder: d.image_placeholder,
        imageUrl: d.image_url,
        url: d.url,
        category: d.category,
        status: mappedStatus === "published" ? "approved" : mappedStatus,
        submittedBy: d.submitted_by,
        createdAt: d.created_at,
        views: d.views ?? 0,
        likes: d.likes ?? 0,
        verified: d.verified ?? false,
        is_admin: d.is_admin ?? false,
      };
    });
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

    return data.map((d: DealRow): ProductDeal => ({
      ...d,
      id: d.id,
      title: d.title,
      store: d.store,
      storeNumber: d.store_number,
      phone: d.phone,
      originalPrice: d.original_price,
      discountPrice: d.discount_price,
      price: d.discount_price,
      location: d.location,
      description: d.description,
      imagePlaceholder: d.image_placeholder,
      imageUrl: d.image_url,
      url: d.url,
      category: d.category,
      status: "pending",
      submittedBy: d.submitted_by,
      createdAt: d.created_at,
      views: d.views ?? 0,
      likes: d.likes ?? 0,
      verified: d.verified ?? false,
      is_admin: d.is_admin ?? false,
    }));
  },

  submitDeal: async (
    deal: Omit<ProductDeal, "id" | "status" | "createdAt" | "views" | "likes">,
  ): Promise<void> => {
    const { error } = await supabase.from("product_deals").insert([
      {
        title: deal.title,
        store: deal.store,
        store_number: deal.storeNumber,
        phone: deal.phone,
        original_price: deal.originalPrice,
        discount_price: deal.discountPrice,
        location: deal.location,
        description: deal.description,
        image_placeholder: deal.imagePlaceholder,
        image_url: deal.imageUrl,
        category: deal.category,
        submitted_by: deal.submittedBy,
        verified: deal.verified ?? false,
        is_admin: deal.is_admin ?? false,
        status: deal.is_admin ? "approved" : "pending",
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

    const mappedStatus = ServiceUtils.mapStatus(data.status);
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
      status: mappedStatus === "published" ? "approved" : mappedStatus,
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
