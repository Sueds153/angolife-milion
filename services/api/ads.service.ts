import { supabase } from "../core/supabaseClient";

export interface Ad {
  id: string;
  type: 'hero' | 'partner';
  media_type: 'image' | 'video';
  format: 'banner' | 'interstitial' | 'rewarded' | 'all';
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

export const AdsService = {
  async getAds(onlyActive = true): Promise<Ad[]> {
    let query = supabase
      .from('ads')
      .select('*')
      .order('display_order', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getSettings(): Promise<SystemSettings> {
    const defaultSettings: SystemSettings = {
      google_ads: {
        enabled: false,
        client: '',
        slots: { homeHero: '', homeFooter: '', jobsList: '' },
      },
      contact_info: { whatsapp: '' },
    };

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error || !data || data.length === 0) return defaultSettings;

      const settings: Record<string, unknown> = {};
      data.forEach(item => {
        settings[item.key] = item.value;
      });

      return { ...defaultSettings, ...(settings as Partial<SystemSettings>) } as SystemSettings;
    } catch {
      return defaultSettings;
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

  async updateSetting(key: string, value: unknown) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    
    if (error) throw error;
  }
};
