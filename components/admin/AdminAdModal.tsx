import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Video, Globe, Clock, Layout, MapPin, Upload, Loader2, Play } from 'lucide-react';
import { Ad, AdsService } from '../../services/api/ads.service';
import { StorageService } from '../../services/api/storage.service';
import { VideoUtils } from '../../services/utils/videoUtils';
import { useScrollLock } from '../../hooks/useScrollLock';

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
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Ad>>({
    type: 'partner',
    media_type: 'image',
    format: 'banner',
    location: 'home',
    duration_seconds: 6,
    is_active: true,
    display_order: 0,
    image_url: '',
    video_url: '',
  });

  useScrollLock(isOpen);

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
        display_order: 0,
        image_url: '',
        video_url: '',
      });
    }
  }, [editingAd, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await StorageService.uploadAdMedia(file);
      if (publicUrl) {
        if (target === 'video' || file.type.startsWith('video/')) {
          setFormData(prev => ({
            ...prev,
            media_type: 'video',
            video_url: publicUrl,
            // Fallback poster image if none exists
            image_url: prev.image_url || 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1600&q=80',
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            media_type: 'image',
            image_url: publicUrl,
          }));
        }
      } else {
        alert('Não foi possível carregar o ficheiro. Verifique o tamanho do ficheiro.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Erro ao carregar o ficheiro.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData };
      
      // Auto-fallback for image_url if media_type is video
      if (payload.media_type === 'video' && !payload.image_url) {
        payload.image_url = 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1600&q=80';
      }

      // Ensure required image_url exists
      if (!payload.image_url) {
        payload.image_url = 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1600&q=80';
      }

      if (editingAd?.id) {
        await AdsService.updateAd(editingAd.id, payload);
      } else {
        await AdsService.createAd(payload as Omit<Ad, 'id' | 'display_order'>);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Save ad error", error);
      alert("Erro ao guardar anúncio. Por favor tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const embedInfo = VideoUtils.getEmbedUrl(formData.video_url);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-orange-500/20 flex flex-col max-h-[92dvh] my-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500">
              <Layout size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-white">
                {editingAd ? 'Editar Anúncio' : 'Novo Anúncio de Publicidade'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Carregue imagens ou vídeos para campanhas
              </p>
            </div>
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
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto no-scrollbar">

          {/* ── LIVE PREVIEW BOX ── */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-orange-400 tracking-wider block">
              Pré-Visualização do Anúncio
            </label>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center shadow-inner group">
              {formData.media_type === 'video' && formData.video_url ? (
                embedInfo.isEmbed && embedInfo.embedUrl ? (
                  <iframe
                    src={embedInfo.embedUrl}
                    className="w-full h-full border-0 pointer-events-none"
                    title="Preview do vídeo"
                  />
                ) : (
                  <video
                    src={formData.video_url}
                    poster={formData.image_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )
              ) : formData.image_url ? (
                <img
                  src={formData.image_url}
                  alt="Pré-visualização"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <ImageIcon size={36} className="mx-auto text-slate-600" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nenhuma imagem ou vídeo selecionado
                  </p>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-orange-400 font-black text-xs uppercase tracking-widest">
                  <Loader2 size={28} className="animate-spin text-orange-500" />
                  <span>A carregar ficheiro...</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título & Empresa */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Título do Anúncio</label>
              <input 
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-50 dark:bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-orange-500/50 transition-all text-white"
                placeholder="Ex: Campanha de Verão 2026"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome da Empresa / Anunciante</label>
              <input 
                type="text"
                required
                value={formData.company_name || ''}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="w-full bg-slate-50 dark:bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-orange-500/50 transition-all text-white"
                placeholder="Ex: Unitel / Baía de Luanda"
              />
            </div>

            {/* Configs de Exibição */}
            <div className="space-y-2">
              <label htmlFor="ad-location" className="text-[10px] font-black uppercase text-slate-400 ml-1">Onde Aparecer (Local)</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                <select 
                  id="ad-location"
                  value={formData.location || 'home'}
                  onChange={(e) => setFormData({...formData, location: e.target.value as Ad['location']})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 text-xs font-bold appearance-none focus:ring-2 focus:ring-orange-500/50 text-white"
                >
                  <option value="home" className="bg-slate-900">Página Inicial (Home)</option>
                  <option value="jobs" className="bg-slate-900">Página de Empregos</option>
                  <option value="exchange" className="bg-slate-900">Página de Câmbio</option>
                  <option value="all" className="bg-slate-900">Todas as Páginas</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="ad-type" className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo de Anúncio</label>
              <div className="relative">
                <Layout size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                <select 
                  id="ad-type"
                  value={formData.type || 'partner'}
                  onChange={(e) => setFormData({...formData, type: e.target.value as Ad['type']})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 text-xs font-bold appearance-none focus:ring-2 focus:ring-orange-500/50 text-white"
                >
                  <option value="partner" className="bg-slate-900">Anúncio de Parceiro (Secção)</option>
                  <option value="hero" className="bg-slate-900">Destaque Principal (Hero Topo)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="ad-format" className="text-[10px] font-black uppercase text-slate-400 ml-1">Formato do Anúncio</label>
              <div className="relative">
                <Layout size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                <select 
                  id="ad-format"
                  value={formData.format || 'banner'}
                  onChange={(e) => setFormData({...formData, format: e.target.value as Ad['format']})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 text-xs font-bold appearance-none focus:ring-2 focus:ring-orange-500/50 text-white"
                >
                  <option value="banner" className="bg-slate-900">Banner (Carrossel)</option>
                  <option value="interstitial" className="bg-slate-900">Interstitial (Ecrã Inteiro Popup)</option>
                  <option value="rewarded" className="bg-slate-900">Rewarded (Bonificado com Vídeo)</option>
                </select>
              </div>
            </div>

            {/* Duração */}
            <div className="space-y-2">
              <label htmlFor="ad-duration" className="text-[10px] font-black uppercase text-slate-400 ml-1">
                Duração de Exibição (Segundos) <Clock size={10} className="inline ml-1"/>
              </label>
              <input 
                id="ad-duration"
                type="number"
                value={formData.duration_seconds || 6}
                onChange={(e) => setFormData({...formData, duration_seconds: parseInt(e.target.value) || 5})}
                className="w-full bg-slate-50 dark:bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-orange-500/50 text-white"
                min="1"
              />
            </div>

            {/* Selector de Imagem / Vídeo */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Formato do Ficheiro (Media)</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, media_type: 'image'})}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${formData.media_type === 'image' ? 'bg-orange-500/20 border-orange-500 text-orange-400 font-black' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400'}`}
                >
                  <ImageIcon size={18} /> <span className="text-xs uppercase">Imagem (JPG / PNG)</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, media_type: 'video'})}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${formData.media_type === 'video' ? 'bg-orange-500/20 border-orange-500 text-orange-400 font-black' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400'}`}
                >
                  <Video size={18} /> <span className="text-xs uppercase">Vídeo (MP4 / YouTube)</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── FILE UPLOAD BUTTONS & URL INPUTS ── */}
          <div className="space-y-4 pt-2">
            
            {/* Upload & Link Ficheiro de Imagem */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-orange-400">
                  {formData.media_type === 'video' ? 'Capa / Poster do Vídeo (Imagem)' : 'Imagem da Publicidade'}
                </label>
                
                {/* Botão de Upload Direto do Dispositivo */}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-md">
                  <Upload size={12} /> Carregar Imagem
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'image')}
                  />
                </label>
              </div>

              <div className="relative">
                <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="url"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3.5 pl-10 text-xs font-bold text-white placeholder-slate-500"
                  placeholder="https://... (ou carregue o ficheiro acima)"
                />
              </div>
            </div>

            {/* Upload & Link Ficheiro de Vídeo */}
            {formData.media_type === 'video' && (
              <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 space-y-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-orange-400">
                    Ficheiro ou Link do Vídeo (.mp4 ou YouTube)
                  </label>

                  {/* Botão de Upload de Vídeo */}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-md">
                    <Upload size={12} /> Carregar MP4
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'video')}
                    />
                  </label>
                </div>

                <div className="relative">
                  <Video size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                  <input 
                    type="url"
                    value={formData.video_url || ''}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3.5 pl-10 text-xs font-bold text-white placeholder-slate-500"
                    placeholder="https://... (.mp4 ou link do YouTube)"
                  />
                </div>
              </div>
            )}

            {/* Link de Destino ao Clicar no Anúncio */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                Link de Destino ao Clicar (URL do Site ou WhatsApp)
              </label>
              <div className="relative">
                <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={formData.link || ''}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 text-xs font-bold text-white"
                  placeholder="https://... ou https://wa.me/244..."
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4">
             <button 
               type="button"
               onClick={onClose}
               className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 font-black uppercase text-xs tracking-widest py-4 rounded-2xl transition-all cursor-pointer"
             >
               Cancelar
             </button>
             <button 
               type="submit"
               disabled={loading || uploading}
               className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black uppercase text-xs tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 cursor-pointer"
             >
               {loading ? (
                 <Loader2 size={18} className="animate-spin" />
               ) : (
                 <><Save size={18} /> Guardar Anúncio</>
               )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
