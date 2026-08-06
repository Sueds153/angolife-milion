import React, { useEffect, useRef } from 'react';
import {
  X, ShieldCheck, AlertTriangle, Mail, Share2,
  MapPin, Building2, Clock, Briefcase, Banknote,
  CheckCircle2, LightbulbIcon, Users, ExternalLink, Globe, Sparkles, Award
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

  // --- Parse clean job data using JobUtils ---
  const parsed = JobUtils.parseJobData(job);

  // Format description
  let rawDesc = job.description || '';
  if (parsed.extraDescription && !rawDesc.includes(parsed.extraDescription.substring(0, 20))) {
    rawDesc = `${parsed.extraDescription}\n\n${rawDesc}`;
  }
  const formattedDescription = ServiceUtils.formatDescription(rawDesc);

  // Format requirements
  const formattedRequirements =
    job.requirements && job.requirements.length > 0
      ? job.requirements.length === 1 && job.requirements[0].length > 50
        ? ServiceUtils.formatDescription(job.requirements[0])
        : job.requirements
      : [];

  const isFlagged = JobUtils.isFlaggedJob(job);
  const salary    = job.salary ? JobUtils.formatSalary(job.salary) : null;
  const relDate   = ServiceUtils.formatRelativeDate(job.postedAt);

  const handleApplyClick = () => {
    if (parsed.applyMethod === 'url' && parsed.applyTarget && parsed.applyTarget.startsWith('http')) {
      window.open(parsed.applyTarget, '_blank', 'noopener,noreferrer');
    } else {
      onApply(job);
    }
  };

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-slate-950/85 backdrop-blur-md animate-fade-in p-0 md:p-4"
      onClick={onClose}
    >
      {/* ── Modal Window Shell ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da Vaga: ${parsed.cleanTitle}`}
        onClick={e => e.stopPropagation()}
        className="relative flex flex-col w-full bg-slate-900 text-slate-100 rounded-t-[2.5rem] md:rounded-[2.5rem] max-h-[92dvh] md:max-w-4xl shadow-2xl border border-orange-500/20 overflow-hidden animate-slide-up"
      >

        {/* ══════════════════════════════════════════
            STICKY HEADER (Always accessible)
            ══════════════════════════════════════════ */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 z-40">
          {/* Company & Title summary */}
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              <JobLogo src={job.imageUrl} company={parsed.cleanCompany} category={job.category} size={40} />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-white leading-tight truncate">
                {parsed.cleanTitle}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <span>{parsed.cleanCompany}</span>
                <span className="text-slate-600">•</span>
                <span className="text-orange-400 font-bold">{parsed.cleanLocation}</span>
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-orange-500 hover:text-white transition-all duration-200 cursor-pointer shadow-inner"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* ══════════════════════════════════════════
            SCROLLABLE BODY CONTENT
            ══════════════════════════════════════════ */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">

          {/* ── Hero Banner ── */}
          <div className="relative h-28 md:h-36 bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950/50 p-6 flex items-end shrink-0 overflow-hidden">
            {/* Background Mesh Glow */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />

            {/* Banner metadata tags */}
            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-slate-300 border border-white/10 uppercase tracking-wider">
                <Clock size={11} className="text-orange-400" /> {relDate}
              </span>
              {parsed.sourceDomain && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 backdrop-blur-md rounded-full text-[10px] font-bold text-orange-300 border border-orange-500/30 uppercase tracking-wider">
                  <Globe size={11} /> {parsed.sourceDomain}
                </span>
              )}
            </div>
          </div>

          {/* ── Title & Meta Section ── */}
          <div className="px-6 md:px-8 pt-6 pb-4 border-b border-white/5">
            <div className="space-y-3">
              
              {/* Clean Title */}
              <div className="flex items-start gap-2 flex-wrap">
                <h1 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tight">
                  {parsed.cleanTitle}
                </h1>
                {job.isVerified && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 rounded-full border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    <ShieldCheck size={14} className="text-amber-400" /> Verificada
                  </div>
                )}
                {isFlagged && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 rounded-full border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    <AlertTriangle size={14} /> Não confirmada
                  </div>
                )}
              </div>

              {/* Attributes Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">
                  <Building2 size={13} className="text-orange-500" /> {parsed.cleanCompany}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">
                  <MapPin size={13} className="text-orange-500" /> {parsed.cleanLocation}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">
                  <Briefcase size={13} className="text-orange-500" /> {parsed.cleanType}
                </span>
                {parsed.experience && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-300">
                    <Award size={13} className="text-amber-400" /> {parsed.experience}
                  </span>
                )}
                {salary && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                    <Banknote size={13} className="text-emerald-400" /> {salary}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Social Proof Banner ── */}
          {(job.applicationCount || 0) > 0 && (
            <div className="mx-6 md:mx-8 mt-5">
              <div className="flex items-center gap-3 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-xs font-black text-orange-300 uppercase tracking-wide">
                    🔥 Vaga Concorrida
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {job.applicationCount} pessoas já demonstraram interesse nesta vaga.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Main Two-Column Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 md:px-8 py-6 pb-28 md:pb-12">

            {/* ── LEFT COLUMN: Description & Requirements ── */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Sobre a Vaga */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-orange-500/15 pb-2">
                  <Sparkles size={16} className="text-orange-500" />
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">
                    Sobre a Vaga
                  </h3>
                </div>
                <div className="text-slate-300 text-sm md:text-base leading-relaxed space-y-4 font-normal">
                  {formattedDescription.length > 0 ? (
                    formattedDescription.map((paragraph, i) => (
                      <p key={i} className="text-slate-300">{paragraph}</p>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">Nenhuma descrição detalhada fornecida.</p>
                  )}
                </div>
              </section>

              {/* Requisitos */}
              {formattedRequirements.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-orange-500/15 pb-2">
                    <Award size={16} className="text-orange-500" />
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">
                      Requisitos & Perfil
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formattedRequirements.map((req, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-colors"
                      >
                        <CheckCircle2 size={16} className="text-orange-400 shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-slate-200 leading-relaxed">{req}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* External Source Link */}
              {job.sourceUrl && (
                <div className="pt-2">
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-300 underline underline-offset-4 transition-colors"
                  >
                    <ExternalLink size={14} /> Ver publicação original na fonte
                  </a>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Application Sidebar ── */}
            <div className="space-y-6">

              {/* Candidatura Oficial Box */}
              <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 rounded-[2rem] border border-orange-500/30 shadow-2xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 block mb-1">
                    Candidatura Oficial
                  </span>
                  <h4 className="text-lg font-black text-white leading-tight">
                    {parsed.applyMethod === 'url' ? 'Portal de Candidatura' : 'Envio de Currículo'}
                  </h4>
                </div>

                {/* Information Card */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-1.5">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {parsed.applyMethod === 'url' ? 'Plataforma / Canal:' : 'E-mail para Candidatura:'}
                  </span>
                  <p className="text-xs font-extrabold text-slate-100 break-all leading-snug">
                    {parsed.applyDisplayLabel}
                  </p>
                </div>

                {/* Primary CTA Button */}
                <button
                  onClick={handleApplyClick}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {parsed.applyMethod === 'url' ? (
                    <>
                      <Globe size={18} /> Candidatar no Portal <ExternalLink size={14} />
                    </>
                  ) : (
                    <>
                      <Mail size={18} /> Candidatar via E-mail
                    </>
                  )}
                </button>

                {/* Share Button */}
                <button
                  onClick={(e) => onShare(e, job)}
                  className="w-full bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest border border-white/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 size={16} /> Partilhar no WhatsApp
                </button>
              </div>

              {/* Dica Resolve.AO Card */}
              <div className="p-5 bg-amber-500/10 rounded-[2rem] border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <LightbulbIcon size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dica Resolve.AO</span>
                </div>
                <p className="text-xs text-amber-200/90 font-medium leading-relaxed italic">
                  "Destaque as suas principais competências e envie sempre o seu CV em formato PDF para garantir que seja bem visualizado pelos recrutadores."
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MOBILE FIXED BOTTOM BAR
            ══════════════════════════════════════════ */}
        <div className="md:hidden shrink-0 px-4 py-3 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-40 flex items-center gap-3">
          <button
            onClick={handleApplyClick}
            className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            {parsed.applyMethod === 'url' ? (
              <>
                <Globe size={16} /> Candidatar Agora
              </>
            ) : (
              <>
                <Mail size={16} /> Candidatar Agora
              </>
            )}
          </button>
          <button
            onClick={(e) => onShare(e, job)}
            title="Partilhar no WhatsApp"
            className="h-12 w-12 rounded-2xl bg-white/10 text-orange-400 border border-white/10 flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <Share2 size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};
