
import React from 'react';
import { Tag, X, FileUp, RefreshCw, Save } from 'lucide-react';
import { ProductDeal } from '../../types';

interface AdminNewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleCreateDealFast: (e: React.FormEvent) => void;
  newDeal: Partial<ProductDeal>;
  setNewDeal: React.Dispatch<React.SetStateAction<any>>;
  dealFileInputRef: React.RefObject<HTMLInputElement>;
  handleDealImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dealImagePreview: string | null;
  loading: boolean;
}

export const AdminNewDealModal: React.FC<AdminNewDealModalProps> = ({
  isOpen,
  onClose,
  handleCreateDealFast,
  newDeal,
  setNewDeal,
  dealFileInputRef,
  handleDealImageChange,
  dealImagePreview,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in relative z-[100]">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-orange-500/20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] h-full ml-auto flex flex-col pt-10 pb-20 md:pb-6">
        <div className="p-6 border-b border-orange-500/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Tag size={20} />
            </div>
            <h3 className="font-black text-xl uppercase tracking-tight">Nova Oferta</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Fechar Janela">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-orange">
          <form id="new-deal-form" onSubmit={handleCreateDealFast} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Produto</label>
              <input required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="Título da oferta..." value={newDeal.title || ''} onChange={e => setNewDeal({ ...newDeal, title: e.target.value })} title="Título do Produto" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Loja</label>
              <input required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="Nome da loja..." value={newDeal.store || ''} onChange={e => setNewDeal({ ...newDeal, store: e.target.value })} title="Nome da Loja" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Localização</label>
              <input required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="Localização base..." value={newDeal.location || ''} onChange={e => setNewDeal({ ...newDeal, location: e.target.value })} title="Localização da Loja" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Preço (Desconto)</label>
                <input type="number" required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 transition-all text-slate-900 dark:text-white" placeholder="Ex: 5000" value={newDeal.discountPrice || ''} onChange={e => setNewDeal({ ...newDeal, discountPrice: Number(e.target.value) })} title="Preço com Desconto" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Preço Antigo</label>
                <input type="number" required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 transition-all text-slate-900 dark:text-white" placeholder="Ex: 8000" value={newDeal.originalPrice || ''} onChange={e => setNewDeal({ ...newDeal, originalPrice: Number(e.target.value) })} title="Preço Original" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Categoria</label>
              <select title="Categoria" required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 transition-all text-slate-900 dark:text-white appearance-none" value={newDeal.category || ''} onChange={e => setNewDeal({ ...newDeal, category: e.target.value })}>
                <option value="Alimentação">Alimentação</option>
                <option value="Eletrónicos">Eletrónicos</option>
                <option value="Higiene e Limpeza">Higiene e Limpeza</option>
                <option value="Moda e Acessórios">Moda e Acessórios</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Descrição / Folheto</label>
              <textarea required rows={3} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 resize-none transition-all text-slate-900 dark:text-white" placeholder="Detalhes da oferta..." value={newDeal.description || ''} onChange={e => setNewDeal({ ...newDeal, description: e.target.value })} title="Descrição do Desconto" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Imagem Promocional (Máx 150kb WeBP)</label>
              <div onClick={() => dealFileInputRef.current?.click()} className="w-full h-40 border border-dashed border-orange-500/40 rounded-2xl flex flex-col items-center justify-center bg-slate-50 dark:bg-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors overflow-hidden">
                {dealImagePreview ? (
                  <img src={dealImagePreview} alt="Preview Oferta" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <FileUp size={24} className="text-orange-500 mb-2" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase text-center max-w-[200px]">Toque para carregar foto</span>
                  </>
                )}
                <input title="Imagem da Oferta" type="file" accept="image/*" className="hidden" ref={dealFileInputRef} onChange={handleDealImageChange} />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-orange-500/10 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <button form="new-deal-form" type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50" title="Publicar Oferta Agora">
            {loading ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />} Publicar Instantaneamente
          </button>
        </div>
      </div>
    </div>
  );
};
