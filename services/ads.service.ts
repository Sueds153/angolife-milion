import { supabase } from './supabaseClient';

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

export const AdsService = {
  async getAds(): Promise<Ad[]> {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getSettings(): Promise<SystemSettings> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');
    
    if (error) throw error;
    
    const settings: any = {};
    data.forEach(item => {
      settings[item.key] = item.value;
    });
    
    return settings as SystemSettings;
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
