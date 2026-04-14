
import React from 'react';
import { X, Plus, Send } from 'lucide-react';

interface AdminNewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  handleCreateJob: (e: React.FormEvent) => void;
  newJob: {
    title: string;
    company: string;
    location: string;
    type: string;
    description: string;
    applicationEmail: string;
    requirements: string[];
    newRequirement: string;
  };
  setNewJob: React.Dispatch<React.SetStateAction<any>>;
  addRequirement: () => void;
  removeRequirement: (index: number) => void;
}

export const AdminNewJobModal: React.FC<AdminNewJobModalProps> = ({
  isOpen,
  onClose,
  loading,
  handleCreateJob,
  newJob,
  setNewJob,
  addRequirement,
  removeRequirement
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-orange-500/30 overflow-hidden flex flex-col max-h-[95vh] mx-auto">
        <div className="p-6 md:p-8 border-b border-orange-500/10 flex justify-between items-center text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 pt-[calc(1.5rem+var(--sat))]">
          <div>
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Publicação Manual</h3>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-1">Criar nova vaga na hora</p>
          </div>
          <button onClick={onClose} className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-lg text-slate-400 hover:text-orange-500 transition-all" title="Fechar Modal">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          <form id="new-job-form" onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="job-title" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título da Vaga *</label>
              <input
                id="job-title"
                required
                type="text"
                placeholder="Ex: Engenheiro de Software"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                value={newJob.title}
                onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                title="Título do Cargo"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="job-company" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Empresa *</label>
              <input
                id="job-company"
                required
                type="text"
                placeholder="Ex: Sonangol"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                value={newJob.company}
                onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                title="Nome da Entidade"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="job-location" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Localização</label>
              <input
                id="job-location"
                type="text"
                placeholder="Ex: Luanda, Talatona"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                value={newJob.location}
                onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                title="Localidade"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="job-type" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Regime</label>
              <select
                id="job-type"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white appearance-none"
                value={newJob.type}
                onChange={e => setNewJob({ ...newJob, type: e.target.value })}
                title="Regime de Trabalho"
              >
                <option value="Tempo Inteiro">Tempo Inteiro</option>
                <option value="Remoto">Remoto</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Estágio">Estágio</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div className="col-span-full space-y-1">
              <label htmlFor="job-email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail para Candidatura *</label>
              <input
                id="job-email"
                required
                type="email"
                placeholder="rh@empresa.ao"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                value={newJob.applicationEmail}
                onChange={e => setNewJob({ ...newJob, applicationEmail: e.target.value })}
                title="Canal de Candidatura"
              />
            </div>
            <div className="col-span-full space-y-1">
              <label htmlFor="job-desc" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição</label>
              <textarea
                id="job-desc"
                rows={4}
                placeholder="Descreva as responsabilidades da vaga..."
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white resize-none"
                value={newJob.description}
                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                title="Descrição Detalhada"
              />
            </div>

            <div className="col-span-full space-y-3">
              <label htmlFor="job-req-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Requisitos</label>
              <div className="flex gap-2">
                <input
                  id="job-req-input"
                  type="text"
                  placeholder="Adicionar requisito..."
                  className="flex-1 px-5 py-4 bg-slate-50 dark:bg-white/5 border border-orange-500/10 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                  value={newJob.newRequirement}
                  onChange={e => setNewJob({ ...newJob, newRequirement: e.target.value })}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  title="Novo Requisito"
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  title="Adicionar Requisito à Lista"
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 p-4 rounded-2xl active:scale-95 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newJob.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-3 py-1.5 rounded-lg border border-orange-500/20 text-[10px] font-black uppercase tracking-tight">
                    <span>{req}</span>
                    <button type="button" onClick={() => removeRequirement(i)} title="Remover Requisito" className="hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-orange-500/10 bg-slate-50/50 dark:bg-slate-800/30 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]"
            title="Descartar Alterações"
          >
            Cancelar
          </button>
          <button
            form="new-job-form"
            disabled={loading}
            type="submit"
            className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            title="Guardar e Publicar Vaga"
          >
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <><Send size={16} /> Publicar Agora</>}
          </button>
        </div>
      </div>
    </div>
  );
};
