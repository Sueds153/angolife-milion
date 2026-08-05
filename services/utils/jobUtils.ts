/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { Job } from '../../types';

const PROVINCES = [
  'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Namibe', 'Cuanza Sul',
  'Cuanza Norte', 'Malanje', 'Uíge', 'Zaire', 'Lunda Norte', 'Lunda Sul',
  'Moxico', 'Bié', 'Cuando Cubango', 'Cunene', 'Bengo',
];

// Denylist de títulos que são notícias (sem acentos, minúsculas)
const NEWS_TITLES = [
  'governo esta a construir 1500 habitacoes sociais no icolo e bengo',
  'investigadores angolanos convidados a publicarem trabalhos em revista cientifica internacional',
  'governo do cuanza sul mobiliza familias para identificar 22 vitimas de acidente',
];

const NEWS_PATTERNS = /esta a construir|estao a construir|convidados? a publicar|mobiliza familias|vitimas? de acidente|inaugur|adjudic|lanca concurso|lanca programa/i;

const CONFIDENTIAL_PATTERN = /empresa confidencial|confidencial/i;

const stripAccents = (text: string): string =>
  (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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
};
