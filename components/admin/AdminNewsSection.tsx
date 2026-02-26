
import React from 'react';
import { Newspaper, Check, RefreshCw, Plus, TrendingUp, Trash2 } from 'lucide-react';
import { NewsArticle } from '../../types';

interface AdminNewsSectionProps {
  pendingNews: NewsArticle[];
  loading: boolean;
  handleApproveAllNews: () => void;
  handleSyncNews: () => void;
  setShowNewNewsModal: (show: boolean) => void;
  handleApproveNews: (id: string) => void;
  handleEditNews: (news: NewsArticle) => void;
  handleDeleteNews: (id: string) => void;
}

export const AdminNewsSection: React.FC<AdminNewsSectionProps> = ({
  pendingNews,
  loading,
  handleApproveAllNews,
  handleSyncNews,
  setShowNewNewsModal,
  handleApproveNews,
  handleEditNews,
  handleDeleteNews
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-orange-500/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 stack-narrow">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <Newspaper size={24} />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase leading-tight">Gestão de Notícias</h3>
            <p className="text-xs text-orange-500 font-bold uppercase tracking-widest">Tens {pendingNews.length} notícias pendentes.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:flex gap-2 w-full md:w-auto">
          <button
            onClick={handleApproveAllNews}
            disabled={loading || pendingNews.length === 0}
            title="Publicar Todas as Notícias Pendentes"
            className="bg-emerald-500 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            <Check size={16} /> Publicar Tudo
          </button>
          <button
            onClick={handleSyncNews}
            disabled={loading}
            title="Sincronizar Notícias via IA"
            className="bg-brand-gold text-slate-900 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} /> Sincronizar
          </button>
          <button
            onClick={() => setShowNewNewsModal(true)}
            title="Criar Notícia Urgente"
            className="bg-orange-500 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20 col-span-2 lg:col-auto"
          >
            <Plus size={16} /> Nova Notícia
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : pendingNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingNews.map(news => (
            <div key={news.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-orange-500/10 shadow-sm hover:border-orange-500/30 transition-all flex flex-col group">
              <div className="h-40 relative overflow-hidden">
                {news.imageUrl ? (
                  <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                    <Newspaper size={32} />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
                    {news.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <h4 className="font-black text-sm uppercase leading-tight line-clamp-2 text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">{news.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">Fonte: {news.source}</p>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 italic mb-6">
                  {news.summary}
                </p>

                <div className="mt-auto grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                  <button
                    onClick={() => handleApproveNews(news.id)}
                    className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all active:scale-95"
                    title="✅ Publicar"
                  >
                    <Check size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleEditNews(news)}
                    className="bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-orange-500 p-3 rounded-xl transition-all active:scale-95"
                    title="✏️ Editar"
                  >
                    <TrendingUp size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDeleteNews(news.id)}
                    className="bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-red-500 p-3 rounded-xl transition-all active:scale-95"
                    title="🗑️ Eliminar"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-orange-500/20">
          <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Sem notícias pendentes.</p>
        </div>
      )}
    </div>
  );
};
