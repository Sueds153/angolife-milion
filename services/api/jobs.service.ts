/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";
import { Job } from "../../types";
import { ServiceUtils } from "../utils/utils";

interface JobRow {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  posted_at: string;
  requirements?: string[];
  source_url?: string;
  application_email?: string;
  status: string;
  imagem_url?: string;
  categoria?: string;
  fonte?: string;
  is_verified?: boolean;
  application_count?: number;
  report_count?: number;
}

export interface ApplicationEntry {
  jobId: string;
  date: string;
  title: string;
  company?: string;
}

export const JobsService = {
  getJobs: async (
    isAdmin: boolean = false,
    options: {
      limit?: number;
      search?: string;
      from?: number;
      to?: number;
      /** Lança a exceção em vez de devolver [] — para a UI mostrar erro. */
      throwOnError?: boolean;
    } = {},
  ): Promise<Job[]> => {
    let query = supabase.from("jobs").select("*");
    if (!isAdmin) {
      query = query.or(
        "status.eq.publicado,status.eq.published,status.eq.aprovado,status.eq.approved",
      );
      if (options.search && options.search.trim()) {
        // Remove caracteres estruturais do PostgREST (, ( ) ") — sem isto a
        // busca quebra com HTTP 400 (ex: "gerente, tecnico") e devolve 0 vagas.
        const term = options.search
          .trim()
          .replace(/[(),"]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (term) {
          query = query.or(
            `title.ilike.%${term}%,company.ilike.%${term}%,location.ilike.%${term}%`,
          );
        }
      }
      if (typeof options.from === "number" && typeof options.to === "number") {
        query = query.range(options.from, options.to);
      } else if (options.limit && options.limit > 0) {
        query = query.limit(options.limit);
      }
    }

    const { data, error } = await query.order("posted_at", { ascending: false });
    if (error) {
      console.error("Error fetching jobs:", error);
      if (options.throwOnError) throw error;
      return [];
    }

    return data.map((j: JobRow): Job => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location || '',
      type: j.type || '',
      salary: j.salary,
      description: j.description || '',
      postedAt: j.posted_at,
      requirements: j.requirements || [],
      sourceUrl: j.source_url,
      applicationEmail: j.application_email,
      status: ServiceUtils.mapStatus(j.status),
      imageUrl: j.imagem_url,
      category: j.categoria,
      source: j.fonte,
      isVerified: j.is_verified || false,
      applicationCount: j.application_count || 0,
      reportCount: j.report_count || 0,
    }));
  },

  getPendingJobs: async (): Promise<Job[]> => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .or(
        "status.eq.pendente,status.eq.Pendente,status.eq.pending,status.eq.Pending",
      );

    if (error) {
      console.error("❌ [Supabase] Error fetching pending jobs:", error);
      return [];
    }

    return data.map((j: JobRow): Job => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      type: j.type,
      salary: j.salary,
      description: j.description,
      postedAt: j.posted_at,
      requirements: j.requirements || [],
      sourceUrl: j.source_url,
      applicationEmail: j.application_email,
      status: ServiceUtils.mapStatus(j.status),
      imageUrl: j.imagem_url,
      category: j.categoria,
      source: j.fonte,
      isVerified: j.is_verified,
      applicationCount: j.application_count,
      reportCount: j.report_count,
    }));
  },

  deleteJob: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    return !error;
  },

  deleteOldJobs: async (days: number = 30): Promise<{ count: number; success: boolean }> => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("jobs")
      .delete()
      .lt("posted_at", cutoffDate)
      .select("id");

    if (error) {
      console.error("Error deleting old jobs:", error);
      return { count: 0, success: false };
    }
    return { count: data?.length || 0, success: true };
  },

  approveJob: async (id: string, isApproved: boolean): Promise<boolean> => {
    if (isApproved) {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "publicado" })
        .eq("id", id);
      return !error;
    } else {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      return !error;
    }
  },

  approveAllJobs: async (): Promise<boolean> => {
    const { error } = await supabase
      .from("jobs")
      .update({ status: "publicado" })
      .or("status.eq.pending,status.eq.pendente,status.eq.Pending,status.eq.Pendente");
    return !error;
  },

  updateJob: async (id: string, job: Job): Promise<boolean> => {
    const { error } = await supabase
      .from("jobs")
      .update({
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary,
        description: job.description,
        requirements: job.requirements,
        application_email: job.applicationEmail,
        source_url: job.sourceUrl,
        imagem_url: job.imageUrl,
        categoria: job.category,
        fonte: job.source,
        is_verified: job.isVerified,
      })
      .eq("id", id);

    if (error) console.error("Error updating job:", error);
    return !error;
  },

  createJob: async (
    job: Omit<Job, "id" | "postedAt" | "status">,
  ): Promise<boolean> => {
    const { error } = await supabase.from("jobs").insert([
      {
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary,
        description: job.description,
        requirements: job.requirements,
        application_email: job.applicationEmail,
        source_url: job.sourceUrl,
        imagem_url: job.imageUrl,
        categoria: job.category,
        fonte: job.source,
        is_verified: job.isVerified,
        status: "publicado",
        posted_at: new Date().toISOString(),
      },
    ]);
    return !error;
  },

  toggleJobVerification: async (
    id: string,
    isVerified: boolean,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("jobs")
      .update({ is_verified: isVerified })
      .eq("id", id);
    return !error;
  },

  getJobById: async (id: string): Promise<Job | null> => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      title: data.title,
      company: data.company,
      location: data.location,
      type: data.type,
      salary: data.salary,
      description: data.description,
      postedAt: data.posted_at,
      requirements: data.requirements || [],
      sourceUrl: data.source_url,
      applicationEmail: data.application_email,
      status: ServiceUtils.mapStatus(data.status),
      imageUrl: data.imagem_url,
      category: data.categoria,
      source: data.fonte,
      isVerified: data.is_verified || false,
      applicationCount: data.application_count || 0,
      reportCount: data.report_count || 0,
    };
  },

  getJobsByIds: async (ids: string[]): Promise<Job[]> => {
    if (!ids || ids.length === 0) return [];

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .in("id", ids)
      .or(
        "status.eq.publicado,status.eq.published,status.eq.aprovado,status.eq.approved",
      )
      .order("posted_at", { ascending: false });

    if (error || !data) return [];
    return data.map((j: JobRow): Job => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      type: j.type,
      salary: j.salary,
      description: j.description,
      postedAt: j.posted_at,
      requirements: j.requirements || [],
      sourceUrl: j.source_url,
      applicationEmail: j.application_email,
      status: ServiceUtils.mapStatus(j.status),
      imageUrl: j.imagem_url,
      category: j.categoria,
      source: j.fonte,
      isVerified: j.is_verified || false,
      applicationCount: j.application_count || 0,
      reportCount: j.report_count || 0,
    }));
  },

  incrementApplicationCount: async (id: string): Promise<boolean> => {
    // RPC SECURITY DEFINER (migração 20261008000003): os updates diretos em
    // jobs eram bloqueados silenciosamente pela RLS para anon/authenticated.
    const { error } = await supabase.rpc("bump_job_counter", {
      p_job_id: id,
      p_kind: "application",
    });
    if (error) {
      console.error("Error incrementing application count:", error);
      return false;
    }
    return true;
  },

  reportJob: async (id: string): Promise<boolean> => {
    // A função incrementa no servidor e move a vaga para 'pendente' às 3
    // denúncias; exige sessão iniciada (auth.uid() não nulo).
    const { error } = await supabase.rpc("bump_job_counter", {
      p_job_id: id,
      p_kind: "report",
    });
    if (error) {
      console.error("Error reporting job:", error);
      return false;
    }
    return true;
  },

  toggleSaveJob: async (userId: string, currentSaved: string[], jobId: string): Promise<string[]> => {
    const isSaved = currentSaved.includes(jobId);
    const newList = isSaved
      ? currentSaved.filter(id => id !== jobId)
      : [...currentSaved, jobId];

    await supabase
      .from("profiles")
      .update({ saved_jobs: newList })
      .eq("id", userId);

    return newList;
  },

  submitJobApplication: async (userId: string, currentHistory: ApplicationEntry[], job: Job): Promise<ApplicationEntry[]> => {
    const newEntry = {
      jobId: job.id,
      title: job.title,
      company: job.company,
      date: new Date().toISOString()
    };
    const newHistory = [newEntry, ...currentHistory];

    await supabase
      .from("profiles")
      .update({ application_history: newHistory })
      .eq("id", userId);

    // NOTA: o incremento do contador é responsabilidade de quem chama
    // (JobsPage/ProfilePage chamam incrementApplicationCount uma única vez) —
    // duplicá-lo aqui fazia +2 por candidatura de utilizador autenticado.

    return newHistory;
  },
};
