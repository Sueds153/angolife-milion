/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";
import { PARTNER_ADS } from "../../constants/ads";

export interface Ad {
  id: string;
  type: 'hero' | 'partner';
  media_type: 'image' | 'video';
  format: 'banner' | 'interstitial' | 'rewarded';
  location: 'home' | 'jobs' | 'exchange' | 'all';
  duration_seconds: number;
  image_url: string;
  video_url?: string;
  link?: string;
  title?: string;
  company_name?: string;
  is_active: boolean;
  display_order: number;
}

export interface SystemSettings {
  google_ads: {
    enabled: boolean;
    client: string;
    slots: {
      homeHero: string;
      homeFooter: string;
      jobsList: string;
    };
  };
  contact_info: {
    whatsapp: string;
  };
}

// Valores padrão caso as tabelas ainda não existam no Supabase
const DEFAULT_SETTINGS: SystemSettings = {
  google_ads: {
    enabled: PARTNER_ADS.googleAds.enabled,
    client: PARTNER_ADS.googleAds.client,
    slots: PARTNER_ADS.googleAds.slots,
  },
  contact_info: { whatsapp: '244929423278' }
};

export const AdsService = {
  /**
   * Retorna lista de anúncios. Retorna [] se a tabela não existir (graceful degradation).
   */
  async getAds(): Promise<Ad[]> {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        // Tabela ainda não existe — não quebrar a app
        console.warn('[AdsService] Tabela "ads" indisponível:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('[AdsService] getAds() falhou silenciosamente:', err);
      return [];
    }
  },

  /**
   * Retorna configurações do sistema. Retorna DEFAULT_SETTINGS se a tabela não existir.
   */
  async getSettings(): Promise<SystemSettings> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error || !data || data.length === 0) {
        console.warn('[AdsService] Tabela "system_settings" indisponível. A usar valores padrão.');
        return DEFAULT_SETTINGS;
      }

      const settings: Record<string, any> = {};
      data.forEach(item => {
        settings[item.key] = item.value;
      });

      return {
        google_ads: settings.google_ads ?? DEFAULT_SETTINGS.google_ads,
        contact_info: settings.contact_info ?? DEFAULT_SETTINGS.contact_info,
      };
    } catch (err) {
      console.warn('[AdsService] getSettings() falhou. A usar valores padrão:', err);
      return DEFAULT_SETTINGS;
    }
  },

  async updateAd(id: string, updates: Partial<Ad>) {
    const { data, error } = await supabase
      .from('ads')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  async createAd(ad: Omit<Ad, 'id' | 'display_order'>) {
    const { data, error } = await supabase
      .from('ads')
      .insert([ad]);
    if (error) throw error;
    return data;
  },

  async deleteAd(id: string) {
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async updateSetting(key: string, value: any) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
  }
};
