/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { supabase } from "../core/supabaseClient";
import type {
  TrajetoAtivo,
  DriverData,
  MotoristaPublico,
  Corredor,
  Confirmacao,
  PedidoDemanda,
  ModoTrajeto,
  TipoVeiculo,
  StatusConfirmacao,
} from "../../types";

type RpcResult = { ok: boolean; error: string | null };

/** Extrai {ok, error} do retorno jsonb das RPCs do VaiJá */
const normalizeRpc = (data: { ok?: boolean; erro?: string } | null, error: { message?: string } | null): RpcResult => {
  if (error) return { ok: false, error: error.message || "Erro de ligação." };
  return { ok: !!data?.ok, error: data?.ok ? null : (data?.erro ?? "Não foi possível concluir.") };
};

export const VaiJaService = {
  // ── Motorista ──────────────────────────────────────
  getDriverData: async (userId: string): Promise<DriverData | null> => {
    const { data, error } = await supabase
      .from("dados_motorista")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return error || !data ? null : (data as DriverData);
  },

  saveDriverData: async (data: {
    userId: string;
    matricula?: string;
    tipoVeiculo?: TipoVeiculo;
    fotoDocumentoUrl?: string;
  }): Promise<{ error: string | null }> => {
    const { error } = await supabase.from("dados_motorista").upsert(
      {
        user_id: data.userId,
        matricula: data.matricula,
        tipo_veiculo: data.tipoVeiculo,
        foto_documento_url: data.fotoDocumentoUrl,
      },
      { onConflict: "user_id" },
    );
    return { error: error?.message || null };
  },

  /** Upload do BI/carta de condução para o bucket privado; devolve o path. */
  uploadDriverDocument: async (userId: string, file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("documentos-motorista")
      .upload(filePath, file, { upsert: false });
    if (error || !data) return null;
    return data.path;
  },

  // ── Trajetos ativos ────────────────────────────────
  getTrajetosAtivos: async (options?: {
    order?: { column: string; ascending: boolean };
  }): Promise<TrajetoAtivo[]> => {
    let query = supabase.from("trajetos_ativos").select("*");
    if (options?.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending });
    } else {
      query = query.order("criado_em", { ascending: false });
    }
    const { data, error } = await query;
    return error ? [] : (data as TrajetoAtivo[]);
  },

  getTrajetoById: async (id: string): Promise<TrajetoAtivo | null> => {
    const { data, error } = await supabase
      .from("trajetos_ativos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return error || !data ? null : (data as TrajetoAtivo);
  },

  getMeusTrajetos: async (motoristaId: string): Promise<TrajetoAtivo[]> => {
    const { data, error } = await supabase
      .from("trajetos_ativos")
      .select("*")
      .eq("motorista_id", motoristaId)
      .order("criado_em", { ascending: false });
    return error ? [] : (data as TrajetoAtivo[]);
  },

  publicarTrajeto: async (input: {
    motoristaId: string;
    modo: ModoTrajeto;
    corredorId?: string;
    pontoPartida: string;
    partidaLat?: number | null;
    partidaLng?: number | null;
    pontoDestino: string;
    destinoLat?: number | null;
    destinoLng?: number | null;
    lugaresTotais: number;
    preco: number;
  }): Promise<{ id: string | null; error: string | null }> => {
    const { data, error } = await supabase
      .from("trajetos_ativos")
      .insert({
        motorista_id: input.motoristaId,
        modo: input.modo,
        corredor_id: input.corredorId || null,
        ponto_partida: input.pontoPartida,
        partida_lat: input.partidaLat,
        partida_lng: input.partidaLng,
        ponto_destino: input.pontoDestino,
        destino_lat: input.destinoLat,
        destino_lng: input.destinoLng,
        lugares_totais: input.lugaresTotais,
        preco: input.preco,
      })
      .select("id")
      .single();
    return { id: data?.id ?? null, error: error?.message || null };
  },

  finalizarTrajeto: async (trajetoId: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc("finalizar_trajeto", { p_trajeto: trajetoId });
    return normalizeRpc(data as { ok?: boolean; erro?: string } | null, error);
  },

  renovarTrajeto: async (trajetoId: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc("renovar_trajeto", { p_trajeto: trajetoId });
    return normalizeRpc(data as { ok?: boolean; erro?: string } | null, error);
  },

  // ── Motoristas (perfil público) ────────────────────
  getMotoristasPublico: async (userIds: string[]): Promise<MotoristaPublico[]> => {
    if (userIds.length === 0) return [];
    const { data, error } = await supabase
      .from("motorista_publico")
      .select("*")
      .in("user_id", userIds);
    return error ? [] : (data as MotoristaPublico[]);
  },

  // ── Confirmações (RPC atómicas) ────────────────────
  confirmarLugar: async (trajetoId: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc("confirmar_lugar", { p_trajeto: trajetoId });
    return normalizeRpc(data as { ok?: boolean; erro?: string } | null, error);
  },

  cancelarConfirmacao: async (trajetoId: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc("cancelar_confirmacao", { p_trajeto: trajetoId });
    return normalizeRpc(data as { ok?: boolean; erro?: string } | null, error);
  },

  marcarEmbarcado: async (confirmacaoId: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc("marcar_embarcado", { p_confirmacao: confirmacaoId });
    return normalizeRpc(data as { ok?: boolean; erro?: string } | null, error);
  },

  getMinhasConfirmacoes: async (passageiroId: string): Promise<Confirmacao[]> => {
    const { data, error } = await supabase
      .from("confirmacoes")
      .select("*")
      .eq("passageiro_id", passageiroId)
      .order("criado_em", { ascending: false });
    return error ? [] : (data as Confirmacao[]);
  },

  /** Viagens ativas do passageiro (confirmadas/embarcadas) com o trajeto associado. */
  getMinhasViagens: async (
    passageiroId: string,
  ): Promise<{ confirmacao: Confirmacao; trajeto: TrajetoAtivo | null }[]> => {
    const { data, error } = await supabase
      .from("confirmacoes")
      .select("*, trajeto:trajetos_ativos(*)")
      .eq("passageiro_id", passageiroId)
      .in("status", ["confirmado", "embarcado"])
      .order("criado_em", { ascending: false });
    if (error) return [];
    return (data as unknown[]).map((row) => {
      const { trajeto, ...confirmacao } = row as {
        trajeto: TrajetoAtivo | null;
        id: string;
        trajeto_id: string;
        passageiro_id: string;
        preco_acordado?: number | null;
        status: StatusConfirmacao;
        criado_em: string;
      };
      return {
        confirmacao: {
          id: confirmacao.id,
          trajetoId: confirmacao.trajeto_id,
          passageiroId: confirmacao.passageiro_id,
          precoAcordado: confirmacao.preco_acordado,
          status: confirmacao.status,
          criadoEm: confirmacao.criado_em,
        },
        trajeto,
      };
    });
  },

  getConfirmacoesDoTrajeto: async (trajetoId: string): Promise<Confirmacao[]> => {
    const { data, error } = await supabase
      .from("confirmacoes")
      .select("*")
      .eq("trajeto_id", trajetoId)
      .order("criado_em", { ascending: false });
    return error ? [] : (data as Confirmacao[]);
  },

  /** Visão do motorista: passageiros do seu trajeto (nome/telefone). */
  getPassageirosDoTrajeto: async (
    trajetoId: string,
  ): Promise<{ confirmacaoId: string; passageiroId: string; status: string; precoAcordado?: number | null; fullName?: string; phone?: string }[]> => {
    const { data, error } = await supabase.rpc("get_passageiros_do_trajeto", { p_trajeto: trajetoId });
    return error ? [] : (data as { confirmacaoId: string; passageiroId: string; status: string; precoAcordado?: number | null; fullName?: string; phone?: string }[]);
  },

  // ── Corredores ─────────────────────────────────────
  getCorredores: async (): Promise<Corredor[]> => {
    const { data, error } = await supabase
      .from("corredores")
      .select("*")
      .eq("ativo", true)
      .order("nome");
    return error ? [] : (data as Corredor[]);
  },

  // ── Demanda (sinais de procura) ────────────────────
  getPedidosDemanda: async (limit = 20): Promise<PedidoDemanda[]> => {
    const { data, error } = await supabase
      .from("pedidos_demanda")
      .select("*")
      .eq("status", "aberto")
      .order("criado_em", { ascending: false })
      .limit(limit);
    return error ? [] : (data as PedidoDemanda[]);
  },

  criarPedido: async (input: {
    passageiroId: string;
    pontoPartida: string;
    partidaLat?: number | null;
    partidaLng?: number | null;
    pontoDestino: string;
    destinoLat?: number | null;
    destinoLng?: number | null;
  }): Promise<{ id: string | null; error: string | null }> => {
    const { data, error } = await supabase
      .from("pedidos_demanda")
      .insert({
        passageiro_id: input.passageiroId,
        ponto_partida: input.pontoPartida,
        partida_lat: input.partidaLat,
        partida_lng: input.partidaLng,
        ponto_destino: input.pontoDestino,
        destino_lat: input.destinoLat,
        destino_lng: input.destinoLng,
      })
      .select("id")
      .single();
    return { id: data?.id ?? null, error: error?.message || null };
  },

  cancelarPedido: async (pedidoId: string): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from("pedidos_demanda")
      .update({ status: "cancelado" })
      .eq("id", pedidoId);
    return { error: error?.message || null };
  },

  // ── Histórico (motorista) ──────────────────────────
  getMeuHistorico: async (motoristaId: string, limit = 20): Promise<TrajetoAtivo[]> => {
    const { data, error } = await supabase
      .from("historico_trajetos")
      .select("*")
      .eq("motorista_id", motoristaId)
      .order("finalizado_em", { ascending: false })
      .limit(limit);
    return error ? [] : (data as TrajetoAtivo[]);
  },
};
