import React, { useEffect, useRef } from 'react';
import {
  X, ShieldCheck, AlertTriangle, Mail, Share2,
  MapPin, Building2, Clock, Briefcase, Banknote,
  CheckCircle2, LightbulbIcon, Users, ExternalLink
} from 'lucide-react';
import { Job } from '../../types';
import { JobLogo } from './JobLogo';
import { ServiceUtils } from '../../services/utils/utils';
import { JobUtils } from '../../services/utils/jobUtils';
import { useScrollLock } from '../../hooks/useScrollLock';

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
  onShare,
}) => {
  useScrollLock(!!job);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when a new job opens
  useEffect(() => {
    if (job && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [job?.id]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!job) return null;

  const formattedDescription = ServiceUtils.formatDescription(job.description);
  const formattedRequirements =
    job.requirements && job.requirements.length > 0
      ? job.requirements.length === 1 && job.requirements[0].length > 50
        ? ServiceUtils.formatDescription(job.requirements[0])
        : job.requirements
      : [];

  const isFlagged = JobUtils.isFlaggedJob?.(job) ?? false;
  const jobType   = JobUtils.displayType(job);
  const location  = job.location ? JobUtils.normalizeLocation(job.location) : null;
  const salary    = job.salary   ? JobUtils.formatSalary(job.salary)        : null;
  const relDate   = ServiceUtils.formatRelativeDate(job.postedAt);

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/*
       * ── Modal Shell ──
       * Mobile  → full-width sheet that slides up from the bottom, max 95dvh
       * Desktop → centred card, max-w-4xl, max-h-[92vh], rounded on all sides
       */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes: ${job.title}`}
        onClick={e => e.stopPropagation()}
        className={[
          'relative flex flex-col w-full overflow-hidden',
          'bg-white dark:bg-slate-900',
          /* mobile: sheet */
          'rounded-t-[2rem] max-h-[95dvh]',
          /* desktop: centred card */
          'md:rounded-[2rem] md:max-w-4xl md:max-h-[92vh]',
          /* shadow + border */
          'shadow-2xl ring-1 ring-black/10 dark:ring-white/5',
          /* slide-up entrance */
          'animate-slide-up',
        ].join(' ')}
      >

        {/* ══════════════════════════════════════════
            TOP NAV BAR — always visible, never scrolls
            ══════════════════════════════════════════ */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-30">
          {/* Drag handle (mobile visual affordance) */}
          <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-200 dark:bg-white/20" />

          {/* Logo thumbnail */}
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            <JobLogo src={job.imageUrl} company={job.company} category={job.category} size={36} />
          </div>

          {/* Title + company (truncated) */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-slate-900 dark:text-white leading-tight truncate">{job.title}</p>
            <p className="text-[11px] font-semibold text-slate-400 truncate">{job.company}</p>
          </div>

          {/* Verified badge */}
          {job.isVerified && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-full border border-amber-200 dark:border-amber-500/20 shrink-0">
              <ShieldCheck size={12} className="text-amber-500" />
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Verificada</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-orange-500 hover:text-white transition-all duration-200"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* ══════════════════════════════════════════
            SCROLLABLE BODY
            ══════════════════════════════════════════ */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">

          {/* ── Hero Banner ── */}
          <div className="relative h-32 md:h-48 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/40 shrink-0 overflow-hidden">
            {/* Decorative mesh */}
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
            />
            {/* Glow */}
            <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />

            {/* Floating logo */}
            <div className="absolute -bottom-7 left-6 md:left-8 w-14 h-14 md:w-16 md:h-16 rounded-[1.1rem] bg-white dark:bg-slate-800 shadow-2xl border-[3px] border-white dark:border-slate-900 flex items-center justify-center overflow-hidden">
              <JobLogo src={job.imageUrl} company={job.company} category={job.category} size={64} />
            </div>

            {/* Posted date — top right of banner */}
            <div className="absolute top-3 right-4 flex items-center gap-1 px-2 py-1 bg-black/30 rounded-full backdrop-blur-md">
              <Clock size={10} className="text-white/60" />
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">{relDate}</span>
            </div>
          </div>

          {/* ── Job Identity Block ── */}
          <div className="px-6 md:px-8 pt-10 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Left: title + meta */}
              <div className="space-y-2 flex-1 min-w-0">
                {/* Title */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {job.title}
                  </h2>
                  {job.isVerified && (
                    <ShieldCheck size={18} className="text-amber-500 shrink-0" fill="currentColor" fillOpacity={0.25} />
                  )}
                  {isFlagged && (
                    <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                  )}
                </div>

                {/* Company name */}
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 size={13} className="text-orange-400 shrink-0" />
                  {job.company}
                  {job.source && job.isVerified && (
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                  )}
                  {job.source && job.isVerified && (
                    <span className="text-[11px] text-slate-400 font-semibold">via {job.source}</span>
                  )}
                </p>

                {/* Attribute pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {location && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                      <MapPin size={11} className="text-orange-500" /> {location}
                    </span>
                  )}
                  {jobType && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                      <Briefcase size={11} className="text-orange-500" /> {jobType}
                    </span>
                  )}
                  {salary && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
                      <Banknote size={11} className="text-emerald-500" /> {salary}
                    </span>
                  )}
                </div>
              </div>

              {/* Desktop Apply CTA */}
              <div className="hidden md:flex flex-col items-stretch gap-2 shrink-0 w-44">
                <button
                  onClick={() => onApply(job)}
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white py-3 px-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/25 transition-all duration-200"
                >
                  <Mail size={14} /> Candidatar-se
                </button>
                <button
                  onClick={e => onShare(e, job)}
                  title="Partilhar no WhatsApp"
                  className="flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-500/40 py-2.5 px-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-200"
                >
                  <Share2 size={13} /> Partilhar
                </button>
              </div>
            </div>
          </div>

          {/* ── Social proof (urgency) ── */}
          {(job.applicationCount || 0) > 0 && (
            <div className="mx-6 md:mx-8 mb-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-500/8 rounded-2xl border border-orange-200 dark:border-orange-500/15">
                {/* Avatar stack */}
                <div className="flex -space-x-2 shrink-0">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-orange-200 dark:bg-orange-500/30 border-2 border-white dark:border-slate-900" />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-orange-500" />
                  <span className="text-[11px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                    <span className="animate-pulse inline-block mr-1">🔥</span>
                    {job.applicationCount} pessoas já mostraram interesse
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Two-column content grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 px-6 md:px-8 py-6 pb-32 md:pb-8">

            {/* ── LEFT: description + requirements ── */}
            <div className="lg:col-span-3 space-y-8">

              {/* Description */}
              {formattedDescription.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-orange-500" />
                    <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
                      Sobre a Vaga
                    </h3>
                  </div>
                  <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {formattedDescription.map((p, i) => (
                      <p key={i} className={i === 0 ? 'font-medium' : ''}>{p}</p>
                    ))}
                  </div>
                </section>
              )}

              {/* Requirements */}
              {formattedRequirements.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-orange-500" />
                    <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
                      Requisitos
                    </h3>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {formattedRequirements.map((req, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 p-3.5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 group/req hover:border-orange-300 dark:hover:border-orange-500/30 transition-colors"
                      >
                        <CheckCircle2 size={14} className="text-orange-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* External source link */}
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-orange-500 transition-colors"
                >
                  <ExternalLink size={12} /> Ver publicação original
                </a>
              )}
            </div>

            {/* ── RIGHT: apply card + tip ── */}
            <div className="hidden lg:flex lg:col-span-2 flex-col gap-4">

              {/* Application card */}
              <div className="rounded-[1.75rem] bg-slate-950 dark:bg-slate-800 p-6 shadow-2xl text-white overflow-hidden relative">
                {/* Subtle glow inside card */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-orange-500/20 blur-2xl pointer-events-none" />

                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-5">
                  Candidatura Oficial
                </p>

                <div className="space-y-3 relative z-10">
                  {salary && (
                    <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="block text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Salário</span>
                      <span className="text-sm font-black text-emerald-400">{salary}</span>
                    </div>
                  )}

                  {job.applicationEmail && (
                    <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="block text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">E-mail</span>
                      <span className="text-xs font-black text-white break-all">{job.applicationEmail}</span>
                    </div>
                  )}

                  <button
                    onClick={() => onApply(job)}
                    className="w-full mt-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-orange-500/30 transition-all duration-200"
                  >
                    <Mail size={15} /> Candidatar-se
                  </button>

                  <button
                    onClick={e => onShare(e, job)}
                    className="w-full flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white py-3 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all duration-200"
                  >
                    <Share2 size={13} /> Partilhar vaga
                  </button>
                </div>
              </div>

              {/* Tip card */}
              <div className="rounded-[1.75rem] bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <LightbulbIcon size={14} className="text-amber-500 shrink-0" />
                  <p className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Dica Angolife</p>
                </div>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/70 leading-relaxed font-medium italic">
                  "Destaque o seu percurso profissional e anexe sempre o CV em formato PDF para garantir a leitura do RH."
                </p>
              </div>

              {/* Flagged warning */}
              {isFlagged && (
                <div className="rounded-[1.75rem] bg-amber-50 dark:bg-amber-500/5 border border-amber-300 dark:border-amber-500/20 p-4 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
                    Esta vaga não foi confirmada pela nossa equipa. Proceda com cautela.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MOBILE STICKY BOTTOM BAR
            ══════════════════════════════════════════ */}
        <div className="lg:hidden shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 border-t border-slate-100 dark:border-white/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-30">
          <div className="flex gap-3">
            <button
              onClick={() => onApply(job)}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white h-12 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all duration-200"
            >
              <Mail size={15} /> Candidatar Agora
            </button>
            <button
              onClick={e => onShare(e, job)}
              title="Partilhar no WhatsApp"
              className="h-12 w-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:border-emerald-300 active:scale-95 transition-all duration-200 shrink-0"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
