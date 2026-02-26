
import React from 'react';
import { Tag, RefreshCw, Plus, Store, MapPin, Building, Edit3, Check, X } from 'lucide-react';
import { ProductDeal } from '../../types';

interface AdminDealsSectionProps {
  pendingDeals: ProductDeal[];
  loading: boolean;
  handleSyncDeals: () => void;
  setShowNewDealModal: (show: boolean) => void;
  setEditingDeal: (deal: ProductDeal) => void;
  setShowEditDealModal: (show: boolean) => void;
  handleApproveDeal: (id: string) => void;
  handleRejectDeal: (id: string) => void;
}

export const AdminDealsSection: React.FC<AdminDealsSectionProps> = ({
  pendingDeals,
  loading,
  handleSyncDeals,
  setShowNewDealModal,
  setEditingDeal,
  setShowEditDealModal,
  handleApproveDeal,
  handleRejectDeal
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-orange-500/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 stack-narrow">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <Tag size={24} />
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight leading-tight">Descontos Pendentes</h3>
            <p className="text-slate-500 text-xs font-medium">{pendingDeals.length} ofertas a aguardar aprovação</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:flex gap-2 w-full md:w-auto">
          <button
            onClick={handleSyncDeals}
            disabled={loading}
            title="Sincronizar Ofertas via IA"
            className="bg-brand-gold text-slate-900 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} /> Sincronizar
          </button>
          <button
            onClick={() => setShowNewDealModal(true)}
            title="Criar Oferta Rápida"
            className="bg-orange-500 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus size={16} /> Nova Oferta
          </button>
        </div>
      </div>

      {pendingDeals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingDeals.map((deal) => (
            <div key={deal.id} className="bg-white dark:bg-slate-900 border border-orange-500/20 rounded-[2rem] overflow-hidden shadow-xl shadow-amber-500/5 group relative">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-orange-500/20">
                      {deal.category}
                    </span>
                    <h4 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-2">{deal.title}</h4>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                      <Store size={14} className="text-orange-500" /> {deal.store}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest line-through mb-1">
                      {deal.originalPrice.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </div>
                    <div className="text-lg font-black text-orange-500 leading-none">
                      {deal.discountPrice.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                    <MapPin size={12} className="text-orange-500" /> {deal.location}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                    <Building size={12} className="text-orange-500" /> Por: {deal.submittedBy || 'Anónimo'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-orange-500/5 mb-6">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium italic line-clamp-3">
                    {deal.description}
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <button
                    onClick={() => {
                      setEditingDeal(deal);
                      setShowEditDealModal(true);
                    }}
                    disabled={loading}
                    className="bg-brand-dark hover:bg-slate-800 text-white flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 active:scale-95 border border-white/5"
                  >
                    <Edit3 size={16} /> Editar & Publicar
                  </button>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleApproveDeal(deal.id)}
                      disabled={loading}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                      title="Aprovar Desconto"
                    >
                      <Check size={16} /> Aprovar
                    </button>
                    <button
                      onClick={() => handleRejectDeal(deal.id)}
                      disabled={loading}
                      className="bg-red-500 hover:bg-red-600 text-white flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                    >
                      <X size={16} /> Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-orange-500/20">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4 text-orange-500 opacity-40">
            <Check size={32} />
          </div>
          <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Tudo limpo! Sem descontos pendentes.</p>
        </div>
      )}
    </div>
  );
};
