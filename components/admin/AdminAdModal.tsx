import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Video, Globe, Clock, Layout, MapPin } from 'lucide-react';
import { Ad, AdsService } from '../../services/ads.service';

interface AdminAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingAd?: Ad | null;
}

export const AdminAdModal: React.FC<AdminAdModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingAd 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Ad>>({
    type: 'partner',
    media_type: 'image',
    format: 'banner',
    location: 'home',
    duration_seconds: 6,
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    if (editingAd) {
      setFormData(editingAd);
    } else {
      setFormData({
        type: 'partner',
        media_type: 'image',
        format: 'banner',
        location: 'home',
        duration_seconds: 6,
        is_active: true,
        display_order: 0
      });
    }
  }, [editingAd, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAd?.id) {
        await AdsService.updateAd(editingAd.id, formData);
      } else {
        await AdsService.createAd(formData as any);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Save ad error", error);
      alert("Erro ao guardar anúncio.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-gold/10 rounded-xl text-brand-gold">
              <Layout size={20} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-white">
              {editingAd ? 'Editar Anúncio' : 'Novo Anúncio'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
            aria-label="Fechar Modal"
            title="Fechar"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título & Empresa */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Título do Anúncio</label>
              <input 
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-brand-gold/50 transition-all"
                placeholder="Ex: Campanha de Verão"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome da Empresa</label>
              <input 
                type="text"
                required
                value={formData.company_name || ''}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-brand-gold/50 transition-all"
                placeholder="Ex: Coca-Cola Angola"
              />
            </div>

            {/* Configs de Exibição */}
            <div className="space-y-2">
              <label htmlFor="ad-location" className="text-[10px] font-black uppercase text-slate-400 ml-1">Onde Aparecer (Local)</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  id="ad-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value as any})}
                  className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 pl-10 text-xs font-bold appearance-none focus:ring-2 focus:ring-brand-gold/50"
                >
                  <option value="home">Página Inicial</option>
                  <option value="jobs">Página de Empregos</option>
                  <option value="exchange">Página de Câmbio</option>
                  <option value="all">Todas as Páginas</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="ad-format" className="text-[10px] font-black uppercase text-slate-400 ml-1">Formato do Anúncio</label>
              <div className="relative">
                <Layout size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  id="ad-format"
                  value={formData.format}
                  onChange={(e) => setFormData({...formData, format: e.target.value as any})}
                  className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 pl-10 text-xs font-bold appearance-none focus:ring-2 focus:ring-brand-gold/50"
                >
                  <option value="banner">Banner (Carrossel)</option>
                  <option value="interstitial">Interstitial (Ecrã Inteiro)</option>
                  <option value="rewarded">Rewarded (Bonificado)</option>
                </select>
              </div>
            </div>

            {/* Duração & Ordem */}
            <div className="space-y-2">
              <label htmlFor="ad-duration" className="text-[10px] font-black uppercase text-slate-400 ml-1">Duração (Segundos) <Clock size={10} className="inline ml-1"/></label>
              <input 
                id="ad-duration"
                type="number"
                value={formData.duration_seconds}
                onChange={(e) => setFormData({...formData, duration_seconds: parseInt(e.target.value)})}
                className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-brand-gold/50"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo de Media</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, media_type: 'image'})}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${formData.media_type === 'image' ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400'}`}
                >
                  <ImageIcon size={16} /> <span className="text-[10px] font-black uppercase">Imagem</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, media_type: 'video'})}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${formData.media_type === 'video' ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400'}`}
                >
                  <Video size={16} /> <span className="text-[10px] font-black uppercase">Vídeo</span>
                </button>
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">URL da Imagem (Poster se for vídeo)</label>
              <div className="relative">
                <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="url"
                  required
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 pl-10 text-xs font-bold"
                  placeholder="https://..."
                />
              </div>
            </div>

            {formData.media_type === 'video' && (
              <div className="space-y-2 animate-slide-up">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">URL do Vídeo (.mp4)</label>
                <div className="relative">
                  <Video size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="url"
                    required
                    value={formData.video_url || ''}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 pl-10 text-xs font-bold"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Link de Destino (URL/WhatsApp)</label>
              <div className="relative">
                <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={formData.link || ''}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 pl-10 text-xs font-bold"
                  placeholder="https://... ou wa.me/..."
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4">
             <button 
               type="button"
               onClick={onClose}
               className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-600 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all"
             >
               Cancelar
             </button>
             <button 
               type="submit"
               disabled={loading}
               className="flex-1 bg-brand-gold hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
             >
               {loading ? (
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                 <><Save size={16} /> Gravar Anúncio</>
               )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
