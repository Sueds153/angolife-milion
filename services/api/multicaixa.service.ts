/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";
import type {
  EstadoMulticaixa,
  Multicaixa,
  RankingGuardiao,
  ResultadoReporte,
  StatusAprovacao,
  StatusDinheiro,
  StatusFila,
  TipoNotas,
} from "../../types";

type RpcResult = { ok: boolean; error: string | null };

/** Extrai {ok, error} do retorno jsonb das RPCs da Multicaixa */
const normalizeRpc = (data: { ok?: boolean; erro?: string } | null, error: { message?: string } | null): RpcResult => {
  if (error) return { ok: false, error: error.message || "Erro de ligação." };
  return { ok: !!data?.ok, error: data?.ok ? null : (data?.erro ?? "Não foi possível concluir.") };
};

/** Resultado do RPC multicaixa_mais_proximo_com_dinheiro. */
export interface AtmProximo {
  encontrado: boolean;
  id?: string;
  nome?: string;
  banco_operador?: string | null;
  bairro?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distancia_km?: number | null;
  confirmado?: boolean;
  min_ultimo_report?: number | null;
}

export const MulticaixaService = {
  // ── Estado dos ATMs ────────────────────────────────
  getEstados: async (lat: number, lng: number, raioKm?: number): Promise<EstadoMulticaixa[]> => {
    const { data, error } = await supabase.rpc("multicaixa_estados", {
      p_lat: lat,
      p_lng: lng,
      p_raio_km: raioKm ?? null,
    });
    return error ? [] : (data as EstadoMulticaixa[]);
  },

  /** CTA "Leva-me": ATM com dinheiro mais próximo das coordenadas. */
  getMaisProximoComDinheiro: async (lat: number, lng: number): Promise<AtmProximo> => {
    const { data, error } = await supabase.rpc("multicaixa_mais_proximo_com_dinheiro", {
      p_lat: lat,
      p_lng: lng,
    });
    if (error) return { encontrado: false };
    return (data ?? { encontrado: false }) as AtmProximo;
  },

  // ── Reporte ────────────────────────────────────────
  reportar: async (input: {
    multicaixaId: string;
    statusDinheiro: StatusDinheiro;
    tipoNotas?: TipoNotas;
    valorMaximo?: number | null;
    statusFila?: StatusFila;
  }): Promise<{ ok: boolean; resultado: ResultadoReporte | null; error: string | null }> => {
    const { data, error } = await supabase.rpc("multicaixa_reportar", {
      p_multicaixa: input.multicaixaId,
      p_status_dinheiro: input.statusDinheiro,
      p_tipo_notas: input.tipoNotas ?? "nao_informado",
      p_valor_maximo: input.valorMaximo ?? null,
      p_status_fila: input.statusFila ?? "nao_informado",
    });
    if (error) return { ok: false, resultado: null, error: error.message || "Erro de ligação." };
    const resultado = (data ?? { ok: false }) as ResultadoReporte;
    return { ok: !!resultado.ok, resultado, error: resultado.ok ? null : (resultado.erro ?? "Não foi possível reportar.") };
  },

  // ── Ranking ────────────────────────────────────────
  getRanking: async (bairro?: string, limite = 20): Promise<RankingGuardiao[]> => {
    const { data, error } = await supabase.rpc("multicaixa_ranking", {
      p_bairro: bairro ?? null,
      p_limite: limite,
    });
    return error ? [] : (data as RankingGuardiao[]);
  },

  // ── Contribuição comunitária ───────────────────────
  adicionar: async (input: {
    nome: string;
    banco: string;
    latitude: number;
    longitude: number;
    bairro?: string;
  }): Promise<{ ok: boolean; id: string | null; aviso?: string | null; error: string | null }> => {
    const { data, error } = await supabase.rpc("multicaixa_adicionar", {
      p_nome: input.nome,
      p_banco: input.banco,
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_bairro: input.bairro ?? null,
    });
    if (error) return { ok: false, id: null, error: error.message || "Erro de ligação." };
    const resultado = (data ?? { ok: false }) as { ok: boolean; erro?: string; id?: string; aviso?: string };
    return {
      ok: !!resultado.ok,
      id: resultado.id ?? null,
      aviso: resultado.aviso,
      error: resultado.ok ? null : (resultado.erro ?? "Não foi possível adicionar."),
    };
  },

  // ── Moderação (admin) ──────────────────────────────
  getPendentes: async (): Promise<Multicaixa[]> => {
    const { data, error } = await supabase
      .from("multicaixas")
      .select("*")
      .eq("status_aprovacao", "pendente_aprovacao")
      .order("criado_em", { ascending: true });
    return error ? [] : (data as Multicaixa[]);
  },

  getPorStatus: async (status: StatusAprovacao): Promise<Multicaixa[]> => {
    const { data, error } = await supabase
      .from("multicaixas")
      .select("*")
      .eq("status_aprovacao", status)
      .order("criado_em", { ascending: false });
    return error ? [] : (data as Multicaixa[]);
  },

  aprovar: async (id: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc("multicaixa_aprovar", { p_id: id });
    return normalizeRpc(data as { ok?: boolean; erro?: string } | null, error);
  },

  rejeitar: async (id: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc("multicaixa_rejeitar", { p_id: id });
    return normalizeRpc(data as { ok?: boolean; erro?: string } | null, error);
  },
};
