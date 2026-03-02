/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "./supabaseClient";
import { ExchangeRate } from "../types";

export const ExchangeService = {
  getRates: async (): Promise<ExchangeRate[]> => {
    const { data, error } = await supabase.from("exchange_rates").select("*");

    if (error) {
      console.error("Error fetching rates:", error);
      return [];
    }

    return data.map((r: any) => ({
      currency: r.currency,
      formalBuy: r.formal_buy,
      formalSell: r.formal_sell,
      informalBuy: r.informal_buy,
      informalSell: r.informal_sell,
      lastUpdated: r.last_updated,
    }));
  },

  updateInformalRate: async (
    currency: "USD" | "EUR",
    buy: number,
    sell: number,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("exchange_rates")
      .update({
        informal_buy: buy,
        informal_sell: sell,
        last_updated: new Date().toISOString(),
      })
      .eq("currency", currency);

    if (error) {
      console.error("Error updating informal rate:", error);
      return false;
    }
    return true;
  },

  updateFormalRate: async (
    currency: "USD" | "EUR",
    buy: number,
    sell: number,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("exchange_rates")
      .update({
        formal_buy: buy,
        formal_sell: sell,
        last_updated: new Date().toISOString(),
      })
      .eq("currency", currency);

    if (error) {
      console.error("Error updating formal rate:", error);
      return false;
    }
    return true;
  },
};
