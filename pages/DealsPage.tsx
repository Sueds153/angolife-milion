
import React, { useEffect, useState, useRef } from 'react';
import { Plus, ShoppingBag, MapPin, X, Camera, FileUp } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { GeminiService } from '../services/gemini';
import { ProductDeal, UserProfile } from '../types';
import { ShareButton } from '../components/ShareButton';

interface DealsPageProps {
  isAuthenticated: boolean;
  user?: UserProfile | null;
  onRequireAuth: () => void;
  onSelectDeal: (deal: ProductDeal) => void;
  onShowInterstitial?: (callback: () => void) => void;
}

export const DealsPage: React.FC<DealsPageProps> = ({ isAuthenticated, user, onRequireAuth, onSelectDeal, onShowInterstitial }) => {
  const [deals, setDeals] = useState<ProductDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '', store: '', storeNumber: '', originalPrice: 0, discountPrice: 0, location: '', description: '', category: 'Alimentação'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const dbDeals = await SupabaseService.getDeals(false);
        setDeals(dbDeals);
      } catch (e) {
        console.error("Error fetching deals", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const handleOpenModal = () => {
    if (!isAuthenticated) onRequireAuth();
    else setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1000;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to webp directly on client! Less than 150kb mostly
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setImagePreview(dataUrl);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], `deal-${Date.now()}.webp`, { type: 'image/webp' });
            setImageFile(compressedFile);
          }
        }, 'image/webp', 0.8);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.store || formData.discountPrice <= 0 || !formData.category) return;

    const executeSubmit = async () => {
      setIsUploading(true);
      let uploadedUrl = '';

      // Upload do ficheiro WebP se existir, senao usar placeholder
      if (imageFile) {
        uploadedUrl = await SupabaseService.uploadDiscountImage(imageFile);
        if (!uploadedUrl) {
          alert('Erro ao carregar a imagem da oferta. Detalhes devem constar na consola.');
          setIsUploading(false);
          return;
        }
      } else {
        uploadedUrl = `https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80`;
      }

      const isUserAdmin = user?.isAdmin || false;
      const userName = user?.fullName || user?.email?.split('@')[0] || 'Anónimo';

      await SupabaseService.submitDeal({
        title: formData.title,
        store: formData.store,
        storeNumber: formData.storeNumber,
        originalPrice: formData.originalPrice || formData.discountPrice,
        discountPrice: formData.discountPrice,
        location: formData.location,
        description: formData.description || `Oferta imperdível de ${formData.title}`,
        category: formData.category,
        imagePlaceholder: uploadedUrl,
        imageUrl: uploadedUrl,
        submittedBy: userName,
        status: isUserAdmin ? 'approved' : 'pending',
        verified: isUserAdmin,
        is_admin: isUserAdmin
      } as any);

      setIsUploading(false);
      setIsModalOpen(false);
      setFormData({ title: '', store: '', storeNumber: '', originalPrice: 0, discountPrice: 0, location: '', description: '', category: 'Alimentação' });
      setImageFile(null);
      setImagePreview(null);
      alert(isUserAdmin ? "Oferta verificada e publicada com sucesso!" : "Boa! A sua promoção foi enviada para análise e aprovação!");
    };

    if (onShowInterstitial && !user?.isPremium && !user?.isAdmin) {
      onShowInterstitial(executeSubmit);
    } else {
      await executeSubmit();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="px-1 flex flex-col md:flex-row justify-between items-center gap-4 stack-narrow">
        <div>
          <h2 className="text-fluid-h2 font-black text-brand-gold uppercase tracking-tighter leading-none">Descontos</h2>
          <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">Preços reais encontrados em Luanda</p>
        </div>
      </div>

      {/* FAB - POSICIONADO ACIMA DA TAB BAR E DO ANÚNCIO */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-36 right-6 z-[90] bg-brand-gold text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 active:scale-90 transition-all animate-bounce-subtle"
        aria-label="Publicar nova oferta"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <div key={i} className="bg-slate-100 dark:bg-slate-900 h-64 rounded-[2rem] animate-pulse"></div>)}
        </div>
      ) : (
        <div className="relative">
          {!isAuthenticated && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-md rounded-[2rem] p-6 text-center animate-fade-in h-96 mt-10">
              <div className="bg-brand-gold p-4 rounded-full shadow-lg mb-4 text-white">
                <ShoppingBag size={32} />
              </div>
              <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-tight text-xl mb-2">Ofertas Exclusivas</h4>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-bold mb-6 max-w-[250px]">
                Crie uma conta gratuita para ver os preços secretos das melhores lojas de Luanda.
              </p>
              <button
                onClick={onRequireAuth}
                className="bg-slate-900 dark:bg-brand-gold text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Entrar / Criar Conta
              </button>
            </div>
          )}

          <div className={`grid grid-cols-1 min-[450px]:grid-cols-2 lg:grid-cols-4 gap-4 ${!isAuthenticated ? 'blur-md select-none pointer-events-none opacity-50 overflow-hidden max-h-[600px]' : ''}`}>
            {deals.map((deal) => (
              <div key={deal.id} onClick={() => onSelectDeal(deal)} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-slate-100 dark:border-white/5 group hover:shadow-xl transition-all cursor-pointer active:scale-[0.98] flex flex-col h-full">
                <div className="h-48 overflow-hidden relative">
                  <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                    -{Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100)}%
                  </div>

                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-brand-gold font-bold line-clamp-1">{deal.store}</span>
                    <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap">Por: {deal.submittedBy || 'Anónimo'}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white leading-tight mb-3 line-clamp-2 min-h-[2.5em]">{deal.title}</h3>

                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div className="flex-1 min-w-[100px]">
                      <p className="text-xs text-slate-400 line-through font-medium">{deal.originalPrice.toLocaleString()} Kz</p>
                      <p className="text-lg font-black text-brand-gold">{deal.discountPrice.toLocaleString()} <span className="text-xs">Kz</span></p>
                    </div>
                    <button
                      className="bg-brand-dark dark:bg-slate-800 text-white p-2 rounded-xl hover:bg-brand-gold transition-colors shadow-lg"
                      aria-label="Ver detalhes da oferta"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORMULÁRIO DE PUBLICAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col animate-fade-in">
          <div className="px-6 py-10 flex justify-between items-center border-b gold-border-b-subtle pt-[calc(2.5rem+var(--sat))]">
            <div className="flex items-center gap-3 text-brand-gold font-black uppercase text-lg">
              <Camera size={24} /> <span>Publicar Oferta</span>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="text-white bg-white/10 p-2 rounded-full" aria-label="Fechar"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <form id="deal-form" onSubmit={handleSubmit} className="space-y-6 pb-20">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Produto</label>
                <input
                  required
                  className="w-full bg-white/5 border gold-border-subtle rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-brand-gold"
                  placeholder="Inserir produto..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  aria-label="Nome do Produto"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loja</label>
                <input
                  required
                  className="w-full bg-white/5 border gold-border-subtle rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-brand-gold"
                  placeholder="Inserir loja..."
                  value={formData.store}
                  onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                  aria-label="Nome da Loja"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Localização</label>
                <input
                  required
                  className="w-full bg-white/5 border gold-border-subtle rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-brand-gold"
                  placeholder="Inserir localização..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  aria-label="Localização da Loja"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Número de Telefone da Loja (Opcional)</label>
                <input
                  className="w-full bg-white/5 border gold-border-subtle rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-brand-gold"
                  placeholder="Inserir contacto..."
                  value={formData.storeNumber}
                  onChange={(e) => setFormData({ ...formData, storeNumber: e.target.value })}
                  aria-label="Telefone da Loja"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preço Com Desconto</label>
                  <input
                    required
                    type="number"
                    className="w-full bg-white/5 border gold-border-subtle rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-brand-gold"
                    placeholder="Ex: 5000"
                    value={formData.discountPrice || ''}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                    aria-label="Preço com Desconto"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preço Original (Riscado)</label>
                  <input
                    required
                    type="number"
                    className="w-full bg-white/5 border gold-border-subtle rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-brand-gold"
                    placeholder="Ex: 8000"
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    aria-label="Preço Original"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria</label>
                <select
                  required
                  className="w-full bg-slate-900 border gold-border-subtle rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-brand-gold appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  aria-label="Categoria"
                >
                  <option value="Alimentação">Alimentação</option>
                  <option value="Eletrónicos">Eletrónicos</option>
                  <option value="Higiene e Limpeza">Higiene e Limpeza</option>
                  <option value="Moda e Acessórios">Moda e Acessórios</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição e Regras da Promoção</label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-white/5 border gold-border-subtle rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-brand-gold resize-none"
                  placeholder="Ex: Válido até sexta-feira. Apenas na loja do Talatona. Limite de 2 por pessoa..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  aria-label="Descrição e Regras"
                />
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed gold-border-subtle rounded-2xl flex flex-col items-center justify-center bg-white/5 relative overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
                title="Sua imagem será rapidamente comprimida para economizar dados móveis"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview Oferta" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <FileUp size={30} className="text-brand-gold mb-2" />
                    <span className="text-[10px] font-black text-brand-gold uppercase text-center max-w-[200px]">Toque para carregar foto<br />(Comprime para WebP &lt; 150kb)</span>
                  </>
                )}
                <input title="Carregar Imagem" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              </div>
            </form>
          </div>

          <div className="p-6 bg-slate-950/95 backdrop-blur-xl border-t gold-border-t-subtle">
            <button form="deal-form" type="submit" disabled={isUploading} className="w-full bg-brand-gold text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2">
              {isUploading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processando...</> : 'ENVIAR AGORA'}
            </button>
          </div>
        </div>
      )
      }

      <style>{`
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-subtle { animation: bounce-subtle 3s infinite ease-in-out; }
      `}</style>
    </div >
  );
};
