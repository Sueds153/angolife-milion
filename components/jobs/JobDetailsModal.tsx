import React from 'react';
import { X, ShieldCheck, Plus, Award, Mail, Share2 } from 'lucide-react';
import { Job } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { JobLogo } from './JobLogo';
import { ServiceUtils } from '../../services/utils/utils';

interface JobDetailsModalProps {
  job: Job | null;
  onClose: () => void;
  onApply: (job: Job) => void;
  onShare: (e: React.MouseEvent, job: Job) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  onClose,
  onApply,
  onShare
}) => {
  if (!job) return null;

  const formattedDescription = ServiceUtils.formatDescription(job.description);
  const formattedRequirements = job.requirements && job.requirements.length > 0
    ? (job.requirements.length === 1 && job.requirements[0].length > 50
      ? ServiceUtils.formatDescription(job.requirements[0])
      : job.requirements)
    : [];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-full md:h-auto md:rounded-[3rem] shadow-2xl border border-orange-500/20 relative overflow-hidden flex flex-col">

        {/* Header Cover */}
        <div className="h-32 md:h-56 bg-gradient-to-r from-slate-950 to-slate-800 relative shrink-0">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-30 bg-black/50 text-white p-3 rounded-full hover:bg-orange-500 transition-all backdrop-blur-md"
            aria-label="Fechar Detalhes"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-24 md:pb-12 -mt-10 relative z-10">
          <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl flex items-center justify-center text-orange-500 border-4 md:border-8 border-orange-500/10 shrink-0 overflow-hidden">
              <JobLogo src={job.imageUrl} company={job.company} category={job.category} size={128} />
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl md:text-5xl font-black text-orange-500 leading-none">{job.title}</h3>
                {job.isVerified && (
                  <ShieldCheck size={28} className="text-amber-500 hidden md:block drop-shadow-sm" fill="currentColor" fillOpacity={0.3} />
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-300 font-black uppercase text-[10px] md:text-sm tracking-[0.2em]">{job.company} • {job.location}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-orange-500/10 pb-2">Sobre a Vaga</h4>
                <div className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed font-medium space-y-3">
                  {formattedDescription.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </section>

              {/* SOCIAL PROOF IN MODAL */}
              {(job.applicationCount || 0) > 0 && (
                <div className="p-6 bg-orange-500/5 rounded-[2rem] border border-orange-500/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Plus size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white uppercase leading-tight italic">🔥 Urgente!</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{job.applicationCount} pessoas já mostraram interesse.</p>
                  </div>
                </div>
              )}

              {formattedRequirements.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-orange-500/10 pb-2">Requisitos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formattedRequirements.map((req, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-orange-500/20">
                        <Award className="text-orange-500 shrink-0 mt-0.5" size={16} />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight leading-relaxed">{req}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 dark:bg-orange-500 p-8 rounded-[2.5rem] shadow-2xl text-white dark:text-slate-950">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 opacity-60">Candidatura Oficial</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-white/10 dark:bg-black/10 rounded-2xl border border-white/5">
                    <span className="block text-[8px] font-black uppercase opacity-60 mb-1">E-mail para Envio:</span>
                    <span className="text-sm md:text-base font-black break-all">{job.applicationEmail}</span>
                  </div>
                  <button
                    onClick={() => onApply(job)}
                    className="w-full bg-orange-500 dark:bg-slate-950 text-white dark:text-orange-500 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Mail size={18} /> Candidatar-se
                  </button>
                </div>
              </div>

              <div className="hidden md:block p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-orange-500/10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Dicas Angolife</p>
                <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                  "Destaque o seu percurso profissional e anexe sempre o CV em formato PDF para garantir a leitura do RH."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky CTA */}
        <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-orange-500/10 z-[40] flex items-center gap-3">
          <button
            onClick={() => onApply(job)}
            className="flex-1 bg-orange-500 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center"
          >
            Candidatar Agora
          </button>
          <button
            onClick={(e) => onShare(e, job)}
            title="Partilhar no WhatsApp"
            className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 text-orange-500 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
          >
            <Share2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
