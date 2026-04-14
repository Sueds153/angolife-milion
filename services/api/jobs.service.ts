/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";
import { Job } from "../../types";
import { ServiceUtils } from "../utils/utils";

export const JobsService = {
  getJobs: async (isAdmin: boolean = false): Promise<Job[]> => {
    let query = supabase.from("jobs").select("*");
    if (!isAdmin) {
      query = query.or(
        "status.eq.publicado,status.eq.published,status.eq.aprovado,status.eq.approved",
      );
    }

    const { data, error } = await query.order("posted_at", { ascending: false });
    if (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }

    return data.map((j: any) => ({
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
      status: ServiceUtils.mapStatus(j.status) as any,
      imageUrl: j.imagem_url || j.image_url || '', // Support multiple common names
      category: j.categoria || j.category || '',
      source: j.fonte || j.source || '',
      isVerified: j.is_verified || false,
      applicationCount: j.application_count || 0,
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

    return data.map((j: any) => ({
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
      status: ServiceUtils.mapStatus(j.status) as any,
      imageUrl: j.imagem_url,
      category: j.categoria,
      source: j.fonte,
      isVerified: j.is_verified,
    }));
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
      .or("status.eq.pending,status.eq.pendente");
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
        status: "publicado",
        posted_at: new Date().toISOString(),
      },
    ]);
    return !error;
  },

  submitJob: async (
    job: Omit<Job, "id" | "postedAt">,
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
        imagem_url: job.imageUrl,
        categoria: job.category,
        fonte: job.source,
        is_verified: job.isVerified || false,
        status: job.status || "pendente",
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
      status: ServiceUtils.mapStatus(data.status) as any,
      imageUrl: data.imagem_url,
      category: data.categoria,
      source: data.fonte,
    };
  },

  getJobsByIds: async (ids: string[]): Promise<Job[]> => {
    if (!ids || ids.length === 0) return [];

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .in("id", ids);

    if (error || !data) return [];
    return data.map((j: any) => ({
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
      status: ServiceUtils.mapStatus(j.status) as any,
      imageUrl: j.imagem_url,
      category: j.categoria,
      source: j.fonte,
    }));
  },

  incrementApplicationCount: async (id: string): Promise<void> => {
    // ⚡️ Otimização: Incremento atómico via RPC para evitar condições de corrida
    await supabase.rpc('increment_application_count', { job_id: id });
  },

  reportJob: async (id: string): Promise<void> => {
    // ⚡️ Otimização: Incremento atómico e auto-pendente via RPC
    await supabase.rpc('increment_report_count', { job_id: id });
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

  submitJobApplication: async (userId: string, currentHistory: any[], job: Job): Promise<any[]> => {
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

    await JobsService.incrementApplicationCount(job.id);

    return newHistory;
  },
};
