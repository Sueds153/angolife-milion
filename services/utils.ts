/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

export const ServiceUtils = {
  sanitize: (text: string): string => {
    if (!text) return "";
    return text
      .trim()
      .replace(/<[^>]*>?/gm, "") // Remove HTML tags
      .replace(/['";\\]/g, ""); // Remove common escape characters
  },

  mapStatus: (status: string | undefined): "pending" | "published" | "approved" | "rejected" => {
    if (!status) return "pending";
    const s = status.toLowerCase();

    if (s === "publicado" || s === "published" || s === "aprovado" || s === "approved" || s === "premium" || s === "ativo" || s === "active") {
      return "published";
    }

    if (s === "rejeitado" || s === "rejected") {
      return "rejected";
    }

    return "pending";
  }
};
