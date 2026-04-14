import React, { useState } from 'react';
import { X, Briefcase, Building2, MapPin, Mail, AlignLeft, Send, AlertCircle, Plus, Trash2, Lock, Clock } from 'lucide-react';
import { JobsService } from '../../services/api/jobs.service';
import { useAppStore } from '../../store/useAppStore';

interface SubmitJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PROVINCES = [
  'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Namibe', 'Cuanza Sul', 'Cuanza Norte',
  'Malanje', 'Uíge', 'Zaire', 'Lunda Norte', 'Lunda Sul', 'Moxico', 'Bié', 'Cuando Cubango', 'Cunene', 'Bengo'
];

const JOB_TYPES = [
  'Tempo Inteiro', 'Tempo Parcial', 'Contrato', 'Estágio', 'Remoto'
];

export const SubmitJobModal: React.FC<SubmitJobModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: 'Luanda',
    type: 'Tempo Inteiro',
    applicationEmail: '',
    description: '',
    requirements: [] as string[],
    newRequirement: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company || !formData.applicationEmail || !formData.description) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const success = await JobsService.submitJob({
        title: formData.title,
        company: formData.company,
        location: formData.location,
        type: formData.type,
        applicationEmail: formData.applicationEmail,
        description: formData.description,
        requirements: formData.requirements,
        status: user?.isAdmin ? 'publicado' : 'pendente'
      });

      if (success) {
        onSuccess();
        onClose();
        setFormData({
          title: '',
          company: '',
          location: 'Luanda',
          type: 'Tempo Inteiro',
          applicationEmail: '',
          description: '',
          requirements: [],
          newRequirement: ''
        });
      } else {
        alert('Erro ao submeter vaga. Tente novamente.');
      }
    } catch (error) {
      console.error('Error submitting job:', error);
      alert('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    if (formData.newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, formData.newRequirement.trim()],
        newRequirement: ''
      });
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-orange-500/20 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-orange-500/10 flex justify-between items-center bg-gradient-to-r from-orange-500/10 to-transparent">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Publicar Nova Vaga</h2>
            <p className="text-[10px] md:text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Sua vaga será revisada em até 24h.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar modal" className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-orange-500 transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título */}
            <div className="space-y-2">
              <label htmlFor="job-title" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Briefcase size={14} className="text-orange-500" /> Título da Vaga *
              </label>
              <input
                id="job-title"
                type="text"
                required
                className="w-full bg-slate-50 dark:bg-white/5 border border-orange-500/10 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm font-bold"
                placeholder="Ex: Contabilista Sénior"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <label htmlFor="job-company" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Building2 size={14} className="text-orange-500" /> Empresa *
              </label>
              <input
                id="job-company"
                type="text"
                required
                className="w-full bg-slate-50 dark:bg-white/5 border border-orange-500/10 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm font-bold"
                placeholder="Nome da sua empresa"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            {/* Localização */}
            <div className="space-y-2">
              <label htmlFor="job-location" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <MapPin size={14} className="text-orange-500" /> Província *
              </label>
              <select
                id="job-location"
                className="w-full bg-slate-50 dark:bg-white/5 border border-orange-500/10 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm font-bold"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              >
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <label htmlFor="job-type" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Clock size={14} className="text-orange-500" /> Tipo de Contrato
              </label>
              <select
                id="job-type"
                className="w-full bg-slate-50 dark:bg-white/5 border border-orange-500/10 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm font-bold"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Email de Candidatura */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="job-email" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Mail size={14} className="text-orange-500" /> Email para Receber CVs *
              </label>
              <input
                id="job-email"
                type="email"
                required
                className="w-full bg-slate-50 dark:bg-white/5 border border-orange-500/10 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm font-bold"
                placeholder="recrutamento@empresa.ao"
                value={formData.applicationEmail}
                onChange={e => setFormData({ ...formData, applicationEmail: e.target.value })}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="job-description" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <AlignLeft size={14} className="text-orange-500" /> Descrição Completa *
              </label>
              <textarea
                id="job-description"
                required
                className="w-full bg-slate-50 dark:bg-white/5 border border-orange-500/10 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm font-bold h-32 resize-none"
                placeholder="Descreva as funções, benefícios e detalhes importantes..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Requisitos */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Requisitos (Opcional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-grow bg-slate-50 dark:bg-white/5 border border-orange-500/10 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm font-bold"
                  placeholder="Adicionar requisito..."
                  value={formData.newRequirement}
                  onChange={e => setFormData({ ...formData, newRequirement: e.target.value })}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  aria-label="Adicionar requisito"
                  className="p-3.5 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all active:scale-95"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {formData.requirements.map((req, i) => (
                  <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {req}
                    <button type="button" onClick={() => removeRequirement(i)} aria-label="Remover requisito" className="hover:text-red-500"><Trash2 size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex gap-3 text-blue-500 dark:text-blue-400">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-[10px] font-bold leading-relaxed">
              Ao publicar, você concorda que todas as informações são verdadeiras. Vagas falsas ou enganosas resultarão no banimento permanente da sua conta.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-full md:w-auto px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full md:w-auto bg-orange-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send size={18} />
            )}
            {loading ? 'PUBLICANDO...' : 'PUBLICAR VAGA'}
          </button>
        </div>
      </div>
    </div>
  );
};
