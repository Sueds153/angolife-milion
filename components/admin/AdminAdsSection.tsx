import React, { useState } from 'react';
import { Monitor, Plus, Trash2, Edit2, Check, X, ExternalLink, Image as ImageIcon, Video, Settings, Save, Globe, MessageCircle, Clock, MapPin, Layout } from 'lucide-react';
import { Ad, SystemSettings, AdsService } from '../../services/api/ads.service';
import { AdminAdModal } from './AdminAdModal';

interface AdminAdsSectionProps {
  ads: Ad[];
  settings: SystemSettings | null;
  loading: boolean;
  onRefresh: () => void;
  onUpdateSetting: (key: string, value: any) => void;
}

export const AdminAdsSection: React.FC<AdminAdsSectionProps> = ({
  ads,
  settings,
  loading,
  onRefresh,
  onUpdateSetting
}) => {
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editedSettings, setEditedSettings] = useState<SystemSettings | null>(settings);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  const handleOpenNewAd = () => {
    setEditingAd(null);
    setIsAdModalOpen(true);
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setIsAdModalOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!editedSettings) return;
    try {
      await onUpdateSetting('google_ads', editedSettings.google_ads);
      await onUpdateSetting('contact_info', editedSettings.contact_info);
      setIsEditingSettings(false);
    } catch (error) {
      console.error("Save settings error", error);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este anúncio?")) return;
    try {
      await AdsService.deleteAd(id);
      onRefresh();
    } catch (error) {
      console.error("Delete ad error", error);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await AdsService.updateAd(id, { is_active: !current });
      onRefresh();
    } catch (error) {
      console.error("Toggle ad error", error);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Gestão de Ads */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-orange-500/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Monitor size={24} />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase leading-tight">Publicidade & Banners</h3>
            <p className="text-xs text-slate-500">{ads.length} anúncios configurados no sistema.</p>
          </div>
        </div>
        <button
          className="w-full md:w-auto bg-brand-gold text-slate-950 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-amber-500/10"
          onClick={handleOpenNewAd}
          title="Criar Novo Anúncio"
        >
          <Plus size={16} /> Novo Anúncio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna de Configurações Globais (Google Ads / WhatsApp) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-orange-500/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-brand-gold" />
                <h4 className="font-black text-sm uppercase tracking-tight">Configurações Globais</h4>
              </div>
              <button 
                onClick={() => {
                  if (isEditingSettings) handleSaveSettings();
                  else {
                    setEditedSettings(settings);
                    setIsEditingSettings(true);
                  }
                }}
                className={`p-2 rounded-xl transition-all ${isEditingSettings ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-brand-gold'}`}
              >
                {isEditingSettings ? <Save size={18} /> : <Edit2 size={18} />}
              </button>
            </div>

            {isEditingSettings ? (
              <div className="space-y-4 animate-fade-in">
                {/* Google Ads Toggle */}
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-blue-500" />
                      <span className="text-[10px] font-black uppercase text-slate-500">Google AdSense</span>
                    </div>
                    <label htmlFor="google-ads-toggle" className="relative inline-flex items-center cursor-pointer">
                      <input 
                        id="google-ads-toggle"
                        type="checkbox" 
                        className="sr-only peer"
                        title="Ativar/Desativar Google Ads"
                        checked={editedSettings?.google_ads.enabled}
                        onChange={(e) => setEditedSettings({
                          ...editedSettings!,
                          google_ads: { ...editedSettings!.google_ads, enabled: e.target.checked }
                        })}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  <input 
                    id="google-ads-client"
                    type="text"
                    placeholder="CLIENT ID (ca-pub-...)"
                    aria-label="Google AdSense Client ID"
                    value={editedSettings?.google_ads.client || ''}
                    onChange={(e) => setEditedSettings({
                      ...editedSettings!,
                      google_ads: { ...editedSettings!.google_ads, client: e.target.value }
                    })}
                    className="w-full bg-white dark:bg-slate-800 border-none rounded-xl p-3 text-[10px] font-bold focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                {/* WhatsApp */}
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-slate-500">WhatsApp de Contacto</span>
                  </div>
                  <input 
                    id="whatsapp-contact"
                    type="text"
                    placeholder="Número (Ex: 244...)"
                    aria-label="Número de WhatsApp para Contacto"
                    value={editedSettings?.contact_info.whatsapp || ''}
                    onChange={(e) => setEditedSettings({
                      ...editedSettings!,
                      contact_info: { ...editedSettings!.contact_info, whatsapp: e.target.value }
                    })}
                    className="w-full bg-white dark:bg-slate-800 border-none rounded-xl p-3 text-[10px] font-bold focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Google AdSense</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${settings?.google_ads.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <span className="text-[10px] font-bold">{settings?.google_ads.enabled ? 'ATIVO' : 'DESATIVADO'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <span className="text-[8px] font-black text-slate-400 uppercase">WhatsApp Atual</span>
                  <span className="text-[10px] font-bold">{settings?.contact_info.whatsapp || 'Não definido'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Anúncios */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-black text-sm uppercase tracking-tight ml-2">Lista de Anúncios Ativos</h4>
          
          <div className="grid grid-cols-1 gap-4">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-orange-500/10 shadow-sm flex items-center gap-4 group hover:border-brand-gold/30 transition-all">
                {/* Preview Thumbnail */}
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-white/5 overflow-hidden flex-shrink-0 relative">
                  {ad.media_type === 'video' ? (
                    <>
                      <video src={ad.video_url} className="w-full h-full object-cover opacity-50" />
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <Video size={16} />
                      </div>
                    </>
                  ) : (
                    <img src={ad.image_url} className="w-full h-full object-cover" alt="preview" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${ad.type === 'hero' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'}`}>
                      {ad.type}
                    </span>
                    <span className="text-[7px] font-black uppercase bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-slate-500 flex items-center gap-1">
                      {ad.media_type === 'video' ? <Video size={8}/> : <ImageIcon size={8}/>} {ad.media_type}
                    </span>
                    <span className="text-[7px] font-black uppercase bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Layout size={8}/> {ad.format}
                    </span>
                    <span className="text-[7px] font-black uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin size={8}/> {ad.location}
                    </span>
                    <span className="text-[7px] font-black uppercase bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={8}/> {ad.duration_seconds}s
                    </span>
                  </div>
                  <h5 className="font-black text-xs uppercase truncate text-slate-800 dark:text-white">
                    {ad.company_name || ad.title || 'Sem Título'}
                  </h5>
                  <p className="text-[8px] text-slate-400 truncate mt-0.5">
                    {ad.link || 'Sem link externo'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditAd(ad)}
                    className="p-2 bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-brand-gold rounded-xl transition-all"
                    title="Editar Anúncio"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleToggleActive(ad.id, ad.is_active)}
                    className={`p-2 rounded-xl transition-all ${ad.is_active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}
                    title={ad.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {ad.is_active ? <Check size={16} /> : <X size={16} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteAd(ad.id)}
                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                    title="Eliminar Anúncio"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                  {ad.link && (
                    <a 
                      href={ad.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Abrir Link"
                      className="p-2 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-brand-gold rounded-xl transition-all"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {ads.length === 0 && !loading && (
              <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                <ImageIcon className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum anúncio encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdminAdModal 
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onSuccess={onRefresh}
        editingAd={editingAd}
      />
    </div>
  );
};
