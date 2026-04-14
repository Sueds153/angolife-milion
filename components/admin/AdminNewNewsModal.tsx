
import React from 'react';
import { X } from 'lucide-react';

interface AdminNewNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleCreateNews: (e: React.FormEvent) => void;
  newNews: {
    title: string;
    category: string;
    imageUrl: string;
    summary: string;
    body: string;
  };
  setNewNews: React.Dispatch<React.SetStateAction<any>>;
}

export const AdminNewNewsModal: React.FC<AdminNewNewsModalProps> = ({
  isOpen,
  onClose,
  handleCreateNews,
  newNews,
  setNewNews
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-orange-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-orange-500/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Notícia Urgente</h3>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-1">Publicação Instantânea AngoLife</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-red-500 hover:text-white transition-all" title="Fechar Modal">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <form id="new-news-form" onSubmit={handleCreateNews} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título da Notícia</label>
              <input
                required
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/30"
                value={newNews.title}
                onChange={e => setNewNews({ ...newNews, title: e.target.value })}
                title="Título da Notícia"
                placeholder="Ex: Novo investimento em Angola"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none appearance-none"
                  value={newNews.category}
                  onChange={e => setNewNews({ ...newNews, category: e.target.value })}
                  title="Selecionar Categoria"
                >
                  <option value="Economia">Economia</option>
                  <option value="Oportunidades">Oportunidades</option>
                  <option value="Utilidade">Utilidade</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="news-image-url" className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL da Imagem</label>
                <input
                  id="news-image-url"
                  placeholder="https://..."
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/30"
                  value={newNews.imageUrl}
                  onChange={e => setNewNews({ ...newNews, imageUrl: e.target.value })}
                  title="URL da Imagem de Capa"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resumo (Visto no Feed)</label>
              <textarea
                rows={2}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none resize-none"
                value={newNews.summary}
                onChange={e => setNewNews({ ...newNews, summary: e.target.value })}
                title="Resumo da Notícia"
                placeholder="Breve resumo para o feed..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corpo da Notícia (Markdown ou HTML)</label>
              <textarea
                required
                rows={6}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none resize-none font-medium"
                value={newNews.body}
                onChange={e => setNewNews({ ...newNews, body: e.target.value })}
                title="Conteúdo da Notícia"
                placeholder="Escreva aqui o conteúdo completo..."
              />
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-orange-500/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            title="Cancelar e Fechar"
          >
            Cancelar
          </button>
          <button
            form="new-news-form"
            className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
            title="Publicar Notícia Urgente"
          >
            Publicar Agora
          </button>
        </div>
      </div>
    </div>
  );
};
