
import React, { useState } from 'react';
import { Briefcase, Check, RefreshCw, Plus, Building, MapPin, Clock, Mail, ShieldCheck, X, HardHat, Store, Send } from 'lucide-react';
import { Job } from '../../types';

interface AdminJobsSectionProps {
  pendingJobs: Job[];
  loading: boolean;
  handleApprove: (id: string) => void;
  handleApproveAll: () => void;
  handleSyncJobs: () => void;
  setShowNewJobModal: (show: boolean) => void;
  handleToggleVerification: (id: string, currentStatus: boolean) => void;
  handleReject: (id: string) => void;
}

// Helper Component for Job Logo inside Admin
export const JobLogo: React.FC<{ src?: string; company: string; category?: string; size?: number }> = ({ src, company, category, size = 60 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getFallbackIcon = () => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('constru') || cat.includes('engenh')) return <HardHat className="text-orange-500" size={size * 0.5} />;
    if (cat.includes('venda') || cat.includes('comercial')) return <Store className="text-orange-500" size={size * 0.5} />;
    return <Briefcase className="text-orange-500" size={size * 0.5} />;
  };

  return (
    <div
      className={`relative flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl border border-orange-500/10 overflow-hidden shrink-0 shadow-sm ${size === 60 ? 'job-logo-60' : (size === 80 ? 'job-logo-80' : 'job-logo-60')}`}
    >
      {loading && !error && src && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 animate-pulse z-10">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {(!src || error) ? (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900">
          <div className="bg-brand-gold/10 w-full h-full flex items-center justify-center">
            {company ? (
              <span className="text-brand-gold font-black text-xl uppercase">{company.charAt(0)}</span>
            ) : (
              getFallbackIcon()
            )}
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={company}
          className={`w-full h-full object-contain p-2 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      )}
    </div>
  );
};

export const AdminJobsSection: React.FC<AdminJobsSectionProps> = ({
  pendingJobs,
  loading,
  handleApprove,
  handleApproveAll,
  handleSyncJobs,
  setShowNewJobModal,
  handleToggleVerification,
  handleReject
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-orange-500/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 stack-narrow">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <Briefcase size={24} />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase leading-tight">Gestão de Empregos</h3>
            <p className="text-xs text-slate-500">{pendingJobs.length} vagas pendentes de aprovação.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:flex gap-2 w-full md:w-auto">
          <button
            onClick={handleApproveAll}
            disabled={loading || pendingJobs.length === 0}
            title="Publicar Todas as Vagas Pendentes"
            className="bg-emerald-500 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            <Check size={16} /> Publicar Tudo
          </button>
          <button
            onClick={handleSyncJobs}
            disabled={loading}
            title="Sincronizar Vagas via IA"
            className="bg-brand-gold text-slate-900 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} /> Sincronizar
          </button>
          <button
            onClick={() => setShowNewJobModal(true)}
            title="Criar Nova Vaga Manualmente"
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all col-span-2 lg:col-auto"
          >
            <Plus size={16} /> Nova Vaga
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : pendingJobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {pendingJobs.map(job => (
            <div key={job.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-orange-500/10 shadow-sm flex flex-col gap-6 hover:border-orange-500/40 transition-all group lg:p-10">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                <div className="flex-1 space-y-8 w-full">
                  {/* Cabeçalho da Vaga */}
                  <div className="flex items-center gap-4">
                    <h4 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight leading-none">{job.title}</h4>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 whitespace-nowrap">Pendente</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      {/* Secção: Empresa e Base */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-l-4 border-orange-500 pl-3">Identificação e Regime</h5>
                        <div className="flex flex-wrap gap-3">
                          <span className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2.5 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                            <Building size={16} className="text-orange-500" /> {job.company}
                          </span>
                          <span className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2.5 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                            <MapPin size={16} className="text-orange-500" /> {job.location}
                          </span>
                          <span className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2.5 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                            <Clock size={16} className="text-orange-500" /> {job.type}
                          </span>
                        </div>
                      </div>

                      {/* Secção: E-mail de Candidatura */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-l-4 border-orange-500 pl-3">Canal de Candidatura</h5>
                        <div className="bg-slate-900 dark:bg-orange-500/5 p-5 rounded-2xl border border-orange-500/20 flex items-center justify-between group/email overflow-hidden">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                              <Mail size={20} />
                            </div>
                            <div>
                              <span className="block text-[8px] font-black uppercase text-slate-500 mb-0.5 tracking-widest">Enviar CV para:</span>
                              <span className="text-sm font-black text-white dark:text-orange-500 break-all">{job.applicationEmail}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Secção: Requisitos */}
                      {job.requirements && job.requirements.length > 0 && (
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-l-4 border-orange-500 pl-3">Requisitos Chave</h5>
                          <div className="flex flex-wrap gap-2">
                            {job.requirements.map((req, i) => (
                              <span key={i} className="px-3 py-2 bg-slate-50 dark:bg-white/10 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 uppercase tracking-tighter">
                                • {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Secção: Descrição */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-l-4 border-orange-500 pl-3">Descrição da Oferta</h5>
                      <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2.5rem] border border-orange-500/5 max-h-[350px] overflow-y-auto custom-scrollbar-orange">
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed italic font-medium">
                          {job.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full lg:w-auto lg:pt-14">
                  <div className="flex gap-2 w-full lg:w-auto">
                    <button
                      onClick={() => handleToggleVerification(job.id, job.isVerified || false)}
                      className={`p-3 md:p-4 rounded-xl transition-all border ${job.isVerified ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'}`}
                      title={job.isVerified ? "Remover Verificação" : "Verificar Empresa"}
                    >
                      <ShieldCheck size={20} />
                    </button>
                    <button
                      onClick={() => handleApprove(job.id)}
                      disabled={loading}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex-1"
                      title="✅ Publicar Vaga Agora"
                    >
                      <Check size={18} /> Publicar
                    </button>
                  </div>
                  <button
                    onClick={() => handleReject(job.id)}
                    className="bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 w-full lg:w-auto border border-slate-200 dark:border-white/5"
                    title="Rejeitar Vaga Permanentemente"
                  >
                    <X size={18} /> Rejeitar
                  </button>
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
          <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Tudo limpo! Sem vagas pendentes.</p>
        </div>
      )}
    </div>
  );
};
