
import React from 'react';
import { Edit3, X, RefreshCw, Save } from 'lucide-react';
import { ProductDeal } from '../../types';

interface AdminEditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleApproveDeal: (id: string, dealToApprove?: ProductDeal) => void;
  editingDeal: ProductDeal | null;
  setEditingDeal: React.Dispatch<React.SetStateAction<ProductDeal | null>>;
  loading: boolean;
}

export const AdminEditDealModal: React.FC<AdminEditDealModalProps> = ({
  isOpen,
  onClose,
  handleApproveDeal,
  editingDeal,
  setEditingDeal,
  loading
}) => {
  if (!isOpen || !editingDeal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in relative z-[100]">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-brand-dark/20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] h-full ml-auto flex flex-col pt-10 pb-20 md:pb-6">
        <div className="p-6 border-b border-brand-dark/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-dark/10 flex items-center justify-center text-brand-dark">
              <Edit3 size={20} />
            </div>
            <h3 className="font-black text-xl uppercase tracking-tight">Editar Desconto</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Fechar Janela">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-orange">
          <form id="edit-deal-form" onSubmit={(e) => { e.preventDefault(); handleApproveDeal(editingDeal.id, editingDeal); }} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Produto</label>
              <input required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-dark focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="Título da oferta..." value={editingDeal.title} onChange={e => setEditingDeal({ ...editingDeal, title: e.target.value })} title="Editar Título" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Loja</label>
              <input required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-dark focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="Nome da loja..." value={editingDeal.store} onChange={e => setEditingDeal({ ...editingDeal, store: e.target.value })} title="Editar Loja" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Preço (Desconto)</label>
                <input type="number" required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-dark transition-all text-slate-900 dark:text-white" placeholder="Ex: 5000" value={editingDeal.discountPrice || ''} onChange={e => setEditingDeal({ ...editingDeal, discountPrice: Number(e.target.value) })} title="Editar Preço com Desconto" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Preço Antigo</label>
                <input type="number" required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-dark transition-all text-slate-900 dark:text-white" placeholder="Ex: 8000" value={editingDeal.originalPrice || ''} onChange={e => setEditingDeal({ ...editingDeal, originalPrice: Number(e.target.value) })} title="Editar Preço Original" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Descrição</label>
              <textarea required rows={4} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-dark resize-none transition-all text-slate-900 dark:text-white" placeholder="Detalhes da oferta..." value={editingDeal.description || ''} onChange={e => setEditingDeal({ ...editingDeal, description: e.target.value })} title="Editar Descrição" />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-brand-dark/10 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <button form="edit-deal-form" type="submit" disabled={loading} className="w-full bg-brand-dark text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-dark/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50" title="Salvar Alterações do Desconto">
            {loading ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />} Atualizar & Publicar
          </button>
        </div>
      </div>
    </div>
  );
};
