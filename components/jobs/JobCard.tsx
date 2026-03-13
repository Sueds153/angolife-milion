import React from 'react';
import { MapPin, Clock, ShieldCheck, Heart, AlertTriangle, Share2 } from 'lucide-react';
import { Job } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { JobLogo } from './JobLogo';

interface JobCardProps {
  job: Job;
  isSaved: boolean;
  onOpenDetails: (job: Job) => void;
  onToggleSave: (e: React.MouseEvent, jobId: string) => void;
  onReport: (e: React.MouseEvent, jobId: string) => void;
  onShareWhatsApp: (e: React.MouseEvent, job: Job) => void;
  formatRelativeDate: (dateString: string) => string;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSaved,
  onOpenDetails,
  onToggleSave,
  onReport,
  onShareWhatsApp,
  formatRelativeDate
}) => {
  return (
    <div 
      onClick={() => onOpenDetails(job)} 
      className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-orange-500/10 hover:border-orange-500/50 transition-all cursor-pointer group flex flex-col h-full hover:shadow-xl hover:-translate-y-1 relative group overflow-hidden"
    >
      <div className="flex flex-col min-[320px]:flex-row items-start gap-4 mb-4 stack-narrow">
        <JobLogo src={job.imageUrl} company={job.company} category={job.category} size={60} />
        <div className="flex-1 min-w-0 pt-1 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <h3 className="font-black text-slate-900 dark:text-white leading-tight group-hover:text-orange-500 transition-colors line-clamp-2 uppercase text-sm">{job.title}</h3>
            {job.isVerified && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20 shrink-0">
                <ShieldCheck size={14} className="text-amber-500" fill="currentColor" fillOpacity={0.2} />
                <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">
                  {job.source ? `Via ${job.source}` : 'Verificada'}
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest truncate">{job.company}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 flex-1 items-start">
        {job.location && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
            <MapPin size={12} className="text-orange-500" />
            {job.location}
          </div>
        )}
        {job.type && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
            <Clock size={12} className="text-orange-500" />
            {job.type}
          </div>
        )}
      </div>

      {(job.applicationCount || 0) > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700"></div>)}
          </div>
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter italic">
            <span className="animate-pulse inline-block">🔥</span> {job.applicationCount} pessoas candidataram-se
          </span>
        </div>
      )}

      <div className="pt-5 border-t border-orange-500/10 flex items-center justify-between">
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{formatRelativeDate(job.postedAt)}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => onToggleSave(e, job.id)}
            title={isSaved ? "Remover dos Favoritos" : "Guardar Vaga"}
            className={`p-2.5 rounded-xl transition-all ${isSaved ? 'bg-rose-500/10 text-rose-500 opacity-100' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 opacity-100 lg:opacity-0 group-hover:opacity-100'}`}
          >
            <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => onReport(e, job.id)}
            title="Denunciar Vaga"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-100 lg:opacity-0 group-hover:opacity-100"
          >
            <AlertTriangle size={14} />
          </button>
          <button
            onClick={(e) => onShareWhatsApp(e, job)}
            title="Partilhar no WhatsApp"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all opacity-100 lg:opacity-0 group-hover:opacity-100"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
