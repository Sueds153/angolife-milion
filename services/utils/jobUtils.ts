/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { Job } from '../../types';

const PROVINCES = [
  'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Namibe', 'Cuanza Sul',
  'Cuanza Norte', 'Malanje', 'Uíge', 'Zaire', 'Lunda Norte', 'Lunda Sul',
  'Moxico', 'Bié', 'Cuando Cubango', 'Cunene', 'Bengo',
];

const NEWS_TITLES = [
  'governo esta a construir 1500 habitacoes sociais no icolo e bengo',
  'investigadores angolanos convidados a publicarem trabalhos em revista cientifica internacional',
  'governo do cuanza sul mobiliza familias para identificar 22 vitimas de acidente',
];

const NEWS_PATTERNS = /esta a construir|estao a construir|convidados? a publicar|mobiliza familias|vitimas? de acidente|inaugur|adjudic|lanca concurso|lanca programa/i;
const CONFIDENTIAL_PATTERN = /empresa confidencial|confidencial/i;

const stripAccents = (text: string): string =>
  (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export interface ParsedJobInfo {
  cleanTitle: string;
  cleanCompany: string;
  cleanLocation: string;
  cleanType: string;
  experience?: string;
  extraDescription?: string;
  applyMethod: 'email' | 'url';
  applyTarget: string;
  applyDisplayLabel: string;
  sourceDomain?: string;
}

export const JobUtils = {
  normalizeLocation(raw?: string): string {
    if (!raw) return 'Angola';
    const parts: string[] = [];
    for (const rawPart of raw.split(',')) {
      const part = rawPart.trim().replace(/\s{2,}/g, ' ');
      if (!part) continue;
      if (parts.some(p => p.toLowerCase() === part.toLowerCase())) continue;
      parts.push(part);
    }
    if (parts.length > 1 && parts[parts.length - 1].toLowerCase() === 'angola') {
      parts.pop();
    }
    return parts.length > 0 ? parts.join(', ') : 'Angola';
  },

  detectProvince(raw?: string): string | null {
    if (!raw) return null;
    const norm = stripAccents(this.normalizeLocation(raw)).toLowerCase();
    for (const province of PROVINCES) {
      const key = stripAccents(province).toLowerCase();
      if (norm.includes(key)) return province;
    }
    return null;
  },

  inferType(title?: string): string {
    if (!title) return '';
    const t = title.toLowerCase();
    if (/est[áa]gio|estagi[áa]ri|trainee|young graduate/.test(t)) return 'Estágio';
    if (/tempo indeterminado|tempo integral|full[- ]?time/.test(t)) return 'Tempo Inteiro';
    if (/tempo determinado/.test(t)) return 'Tempo Determinado';
    if (/contrato de servi[çc]os|presta[çc][ãa]o de servi[çc]os/.test(t)) return 'Contrato de Serviços';
    if (/part[- ]?time|meio per[íi]odo/.test(t)) return 'Part-time';
    if (/remoto|remote|h[íi]brido/.test(t)) return 'Remoto';
    if (/a definir/.test(t)) return 'A definir';
    return '';
  },

  displayType(job: Pick<Job, 'title' | 'type'>): string {
    if (job.type) return job.type;
    return this.inferType(job.title);
  },

  isFlaggedJob(job: Pick<Job, 'title' | 'company'>): boolean {
    const normTitle = stripAccents(job.title || '').toLowerCase().trim();
    if (NEWS_TITLES.some(t => normTitle === t)) return true;
    if (NEWS_PATTERNS.test(normTitle)) return true;
    if (CONFIDENTIAL_PATTERN.test(job.company || '')) return true;
    return false;
  },

  dedupeJobs(jobs: Job[]): Job[] {
    const seen = new Set<string>();
    const result: Job[] = [];
    for (const job of jobs) {
      const key = `${(job.title || '').trim().toLowerCase()}|${(job.company || '').trim().toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(job);
    }
    return result;
  },

  formatSalary(salary?: string): string {
    if (!salary) return '';
    return salary.replace(/\s{2,}/g, ' ').trim();
  },

  /**
   * Smart parser for scraped jobs that have concatenated metadata in the title or email fields.
   */
  parseJobData(job: Job): ParsedJobInfo {
    let rawTitle = (job.title || '').trim();
    let company = (job.company || '').trim();
    let location = this.normalizeLocation(job.location);
    let type = this.displayType(job);
    let experience: string | undefined = undefined;
    let extraDescription: string | undefined = undefined;

    // --- 1. Clean concatenated Title ---
    // Scraped titles often look like:
    // "1. Contabilista Aduaneiro / 2. Operativo de TerminalTT LDALuanda , LuandaTempo indeterminado5 anos de experiência exigidoAssegurar o correto..."

    // Extract experience if present in title
    const expMatch = rawTitle.match(/(\d+\s*anos?\s*de\s*experi[êe]ncia[^\s,.]*)/i);
    if (expMatch) {
      experience = expMatch[1].trim();
    }

    // Cut title at common metadata boundary markers
    const cutoffPatterns = [
      // Company name match if present
      company.length > 2 ? new RegExp(`(${company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i') : null,
      // Common province / location markers glued to title
      /(Luanda\s*,?\s*Luanda|Benguela\s*,?\s*Benguela|Huambo|Cabinda|Angola)/i,
      // Contract type markers
      /(Tempo\s+indeterminado|Tempo\s+determinado|Full[- ]time|Part[- ]time)/i,
      // Experience markers
      /(\d+\s*anos?\s*de\s*experi[êe]ncia)/i,
      // Common description action verbs glued after title/metadata
      /(Assegurar|Garantir|Realizar|Coordenar|Gerenciar|Respons[áa]vel|Supervisionar|Apoiar|Desenvolver|Elaborar|Executar|Prestar|Manter|Controlar|Analisar)/,
    ].filter(Boolean) as RegExp[];

    let earliestCutoff = rawTitle.length;
    let matchStartText = '';

    for (const pattern of cutoffPatterns) {
      const m = rawTitle.match(pattern);
      if (m && m.index !== undefined && m.index > 5 && m.index < earliestCutoff) {
        earliestCutoff = m.index;
        matchStartText = rawTitle.substring(m.index);
      }
    }

    let cleanTitle = rawTitle;
    if (earliestCutoff < rawTitle.length) {
      cleanTitle = rawTitle.substring(0, earliestCutoff).trim();
      
      // Clean trailing punctuation / artifacts
      cleanTitle = cleanTitle.replace(/[\s,/\\\-–—:]+$/, '').trim();

      // If the matched trailing text starts with a description verb, save it as extra description
      const descVerbMatch = matchStartText.match(/(Assegurar|Garantir|Realizar|Coordenar|Gerenciar|Respons[áa]vel|Supervisionar|Apoiar|Desenvolver|Elaborar|Executar|Prestar|Manter|Controlar|Analisar).*/i);
      if (descVerbMatch) {
        extraDescription = descVerbMatch[0].trim();
      }
    }

    // Fallback if title became too short or empty
    if (!cleanTitle || cleanTitle.length < 3) {
      cleanTitle = rawTitle;
    }

    // --- 2. Clean Application Email / Method ---
    let rawEmail = (job.applicationEmail || '').trim();
    let applyMethod: 'email' | 'url' = 'email';
    let applyTarget = rawEmail;
    let applyDisplayLabel = rawEmail;
    let sourceDomain = job.source || undefined;

    const urlMatch = rawEmail.match(/https?:\/\/[^\s]+/i) || (job.sourceUrl ? [job.sourceUrl] : null);

    if (urlMatch || rawEmail.toLowerCase().includes('http') || rawEmail.toLowerCase().includes('candidatar via')) {
      applyMethod = 'url';
      applyTarget = urlMatch ? urlMatch[0] : (job.sourceUrl || '#');

      if (applyTarget.includes('jobartis')) {
        applyDisplayLabel = 'Candidatar via Jobartis';
        sourceDomain = 'Jobartis';
      } else if (applyTarget.includes('linkedin')) {
        applyDisplayLabel = 'Candidatar via LinkedIn';
        sourceDomain = 'LinkedIn';
      } else if (applyTarget.includes('expansao')) {
        applyDisplayLabel = 'Candidatar via Expansão';
        sourceDomain = 'Expansão';
      } else {
        applyDisplayLabel = 'Abrir Portal de Candidatura';
        try {
          const domain = new URL(applyTarget).hostname.replace('www.', '');
          sourceDomain = domain;
        } catch {
          sourceDomain = 'Portal Externo';
        }
      }
    } else {
      const emailMatch = rawEmail.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/i);
      if (emailMatch) {
        applyMethod = 'email';
        applyTarget = emailMatch[0];
        applyDisplayLabel = emailMatch[0];
      } else if (rawEmail) {
        applyMethod = 'email';
        applyTarget = rawEmail;
        applyDisplayLabel = rawEmail;
      } else if (job.sourceUrl) {
        applyMethod = 'url';
        applyTarget = job.sourceUrl;
        applyDisplayLabel = 'Candidatar no Portal Oficial';
      }
    }

    return {
      cleanTitle,
      cleanCompany: company || 'Empresa Confidencial',
      cleanLocation: location,
      cleanType: type || 'Tempo Inteiro',
      experience,
      extraDescription,
      applyMethod,
      applyTarget,
      applyDisplayLabel,
      sourceDomain,
    };
  },
};
