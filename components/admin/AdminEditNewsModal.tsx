
import React from 'react';
import { X } from 'lucide-react';
import { NewsArticle } from '../../types';

interface AdminEditNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleUpdateNews: (e: React.FormEvent) => void;
  editingNews: NewsArticle | null;
  setEditingNews: React.Dispatch<React.SetStateAction<NewsArticle | null>>;
}

export const AdminEditNewsModal: React.FC<AdminEditNewsModalProps> = ({
  isOpen,
  onClose,
  handleUpdateNews,
  editingNews,
  setEditingNews
}) => {
  if (!isOpen || !editingNews) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-orange-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-orange-500/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
          <h3 className="text-xl font-black uppercase tracking-tight">Editar Notícia</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-red-500 hover:text-white transition-all"
            title="Fechar Modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <form id="edit-news-form" onSubmit={handleUpdateNews} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título</label>
              <input
                required
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none"
                value={editingNews.title}
                onChange={e => setEditingNews({ ...editingNews, title: e.target.value })}
                title="Título da Notícia"
                placeholder="Título da notícia..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none appearance-none"
                  value={editingNews.category}
                  onChange={e => setEditingNews({ ...editingNews, category: e.target.value })}
                >
                  <option value="Economia">Economia</option>
                  <option value="Oportunidades">Oportunidades</option>
                  <option value="Utilidade">Utilidade</option>
                  <option value="Investigação">Investigação</option>
                  <option value="Oficial">Oficial</option>
                  <option value="Cultura">Cultura</option>
                  <option value="Sociedade">Sociedade</option>
                  <option value="Angola">Angola</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL da Imagem</label>
                <input
                  placeholder="https://..."
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none"
                  value={editingNews.imageUrl || ''}
                  onChange={e => setEditingNews({ ...editingNews, imageUrl: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resumo</label>
              <textarea
                rows={4}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none resize-none"
                value={editingNews.summary}
                onChange={e => setEditingNews({ ...editingNews, summary: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corpo (HTML)</label>
              <textarea
                required
                rows={8}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none resize-none font-medium"
                value={editingNews.corpo || ''}
                onChange={e => setEditingNews({ ...editingNews, corpo: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit-news-priority"
                className="w-5 h-5 accent-orange-500"
                checked={editingNews.is_priority || false}
                onChange={e => setEditingNews({ ...editingNews, is_priority: e.target.checked })}
              />
              <label htmlFor="edit-news-priority" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Urgente/Exclusivo (Prioridade)
              </label>
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-orange-500/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            title="Descartar Alterações"
          >
            Descartar
          </button>
          <button
            form="edit-news-form"
            className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
            title="Guardar Alterações"
          >
            Guardar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
