import React from 'react';
import { Edit3, X, RefreshCw, Save } from 'lucide-react';
import { Job } from '../../types';

interface AdminEditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleApproveJob: (id: string, jobToApprove?: Job) => void;
  editingJob: Job | null;
  setEditingJob: React.Dispatch<React.SetStateAction<Job | null>>;
  loading: boolean;
}

export const AdminEditJobModal: React.FC<AdminEditJobModalProps> = ({
  isOpen,
  onClose,
  handleApproveJob,
  editingJob,
  setEditingJob,
  loading
}) => {
  if (!isOpen || !editingJob) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in relative z-[100]">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border-l border-orange-500/20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] h-full ml-auto flex flex-col pt-10 pb-20 md:pb-6">
        <div className="p-6 border-b border-orange-500/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Edit3 size={20} />
            </div>
            <h3 className="font-black text-xl uppercase tracking-tight">Editar Vaga</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Fechar Janela">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-orange">
          <form id="edit-job-form" onSubmit={(e) => { e.preventDefault(); handleApproveJob(editingJob.id, editingJob); }} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Título da Vaga *</label>
              <input required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="Título do Cargo..." value={editingJob.title} onChange={e => setEditingJob({ ...editingJob, title: e.target.value })} title="Editar Título" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Empresa *</label>
              <input required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="Nome da Entidade..." value={editingJob.company} onChange={e => setEditingJob({ ...editingJob, company: e.target.value })} title="Editar Empresa" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Localização</label>
                <input className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="Ex: Luanda, Talatona" value={editingJob.location || ''} onChange={e => setEditingJob({ ...editingJob, location: e.target.value })} title="Editar Localização" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Regime</label>
                <select className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white appearance-none" value={editingJob.type || 'Tempo Inteiro'} onChange={e => setEditingJob({ ...editingJob, type: e.target.value })} title="Regime de Trabalho">
                  <option value="Tempo Inteiro">Tempo Inteiro</option>
                  <option value="Remoto">Remoto</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Estágio">Estágio</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Salário (Opcional)</label>
                <input className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="Ex: 500.000 Kz/mês ou A combinar" value={editingJob.salary || ''} onChange={e => setEditingJob({ ...editingJob, salary: e.target.value })} title="Faixa Salarial" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Categoria</label>
                <select className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white appearance-none" value={editingJob.category || 'Geral'} onChange={e => setEditingJob({ ...editingJob, category: e.target.value })} title="Categoria da Vaga">
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Gestão">Gestão</option>
                  <option value="Finanças">Finanças</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Engenharia">Engenharia</option>
                  <option value="Educação">Educação</option>
                  <option value="Logística">Logística</option>
                  <option value="Limpeza & Serviços">Limpeza & Serviços</option>
                  <option value="Vendas & Marketing">Vendas & Marketing</option>
                  <option value="Concurso Público">Concurso Público</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">E-mail para Candidatura *</label>
              <input required type="email" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="rh@empresa.ao" value={editingJob.applicationEmail} onChange={e => setEditingJob({ ...editingJob, applicationEmail: e.target.value })} title="Canal de Candidatura" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">URL de Origem (Opcional)</label>
              <input type="url" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="https://..." value={editingJob.sourceUrl || ''} onChange={e => setEditingJob({ ...editingJob, sourceUrl: e.target.value })} title="Link Original da Vaga" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">URL da Imagem (Opcional)</label>
              <input type="url" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="https://..." value={editingJob.imageUrl || ''} onChange={e => setEditingJob({ ...editingJob, imageUrl: e.target.value })} title="Link da Imagem de Capa" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Fonte</label>
              <input className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white" placeholder="AngoLife" value={editingJob.source || 'AngoLife'} onChange={e => setEditingJob({ ...editingJob, source: e.target.value })} title="Fonte da Vaga" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="job-verified" className="w-5 h-5 accent-orange-500" checked={editingJob.isVerified || false} onChange={e => setEditingJob({ ...editingJob, isVerified: e.target.checked })} />
              <label htmlFor="job-verified" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Marcar como Verificada</label>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Descrição</label>
              <textarea required rows={4} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 resize-none transition-all text-slate-900 dark:text-white" placeholder="Descreva as responsabilidades da vaga..." value={editingJob.description || ''} onChange={e => setEditingJob({ ...editingJob, description: e.target.value })} title="Descrição Detalhada" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Requisitos</label>
              <div className="space-y-2">
                {(editingJob.requirements || []).map((req, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold transition-all text-slate-900 dark:text-white">
                    <span className="flex-1">{req}</span>
                    <button type="button" onClick={() => setEditingJob({ ...editingJob, requirements: editingJob.requirements.filter((_, idx) => idx !== i) })} title="Remover Requisito" className="hover:text-red-500 text-slate-400">×</button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input 
                    id="job-new-req"
                    type="text" 
                    placeholder="Adicionar requisito..." 
                    className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 transition-all text-slate-900 dark:text-white" 
                    onKeyPress={e => e.key === 'Enter' && e.preventDefault() && e.currentTarget.value && setEditingJob({ ...editingJob, requirements: [...(editingJob.requirements || []), e.currentTarget.value] }) && (e.currentTarget.value = '')} 
                    title="Novo Requisito" 
                  />
                  <button 
                    type="button" 
                    onClick={() => { 
                      const input = document.getElementById('job-new-req') as HTMLInputElement;
                      const val = input?.value; 
                      if (val) { 
                        setEditingJob({ ...editingJob, requirements: [...(editingJob.requirements || []), val] }); 
                        if (input) input.value = ''; 
                      } 
                    }} 
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 p-4 rounded-2xl active:scale-95 transition-all" 
                    title="Adicionar Requisito à Lista"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-orange-500/10 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <button form="edit-job-form" type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50" title="Salvar Alterações da Vaga">
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <><Save size={20} /> Atualizar & Publicar</>}
          </button>
        </div>
      </div>
    </div>
  );
};