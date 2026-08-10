/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import type { EstadoMulticaixa, NivelGuardiao, StatusFila, TipoNotas } from "../../types";

/** Centro aproximado de Luanda (fallback quando a geolocalização falha). */
export const LUANDA_CENTER = { lat: -8.839, lng: 13.2894 };

export type EstadoVisivel = "tem_dinheiro" | "sem_dinheiro" | "avariado" | "desconhecido";

export const estadoLabel = (estado: EstadoVisivel): string => {
  switch (estado) {
    case "tem_dinheiro":
      return "Tem dinheiro";
    case "sem_dinheiro":
      return "Sem dinheiro";
    case "avariado":
      return "Avariado";
    default:
      return "Desconhecido";
  }
};

export const estadoEmoji = (estado: EstadoVisivel): string => {
  switch (estado) {
    case "tem_dinheiro":
      return "💰";
    case "sem_dinheiro":
      return "🚫";
    case "avariado":
      return "🔧";
    default:
      return "❓";
  }
};

/** Classes Tailwind do estado (badge / marcador de mapa). */
export const estadoClasses = (estado: EstadoVisivel): { badge: string; dot: string; marker: string } => {
  switch (estado) {
    case "tem_dinheiro":
      return {
        badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        dot: "bg-emerald-500",
        marker: "#10b981",
      };
    case "sem_dinheiro":
      return {
        badge: "bg-red-500/10 text-red-500 border-red-500/20",
        dot: "bg-red-500",
        marker: "#ef4444",
      };
    case "avariado":
      return {
        badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        dot: "bg-amber-500",
        marker: "#f59e0b",
      };
    default:
      return {
        badge: "bg-slate-500/10 text-slate-500 border-slate-500/20",
        dot: "bg-slate-400",
        marker: "#94a3b8",
      };
  }
};

export const nivelLabel = (nivel: string): string => {
  switch (nivel) {
    case "ouro":
      return "Ouro";
    case "prata":
      return "Prata";
    case "bronze":
      return "Bronze";
    default:
      return "Novato";
  }
};

export const nivelClasses = (nivel: string): string => {
  switch (nivel) {
    case "ouro":
      return "bg-amber-400/15 text-amber-600 border-amber-400/30";
    case "prata":
      return "bg-slate-300/20 text-slate-500 border-slate-300/40";
    case "bronze":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
};

export const nivelEmoji = (nivel: string): string => {
  switch (nivel) {
    case "ouro":
      return "🥇";
    case "prata":
      return "🥈";
    case "bronze":
      return "🥉";
    default:
      return "🌱";
  }
};

/** Distância: "450 m" se < 1 km, senão "1,2 km". */
export const formatarDistancia = (km?: number | null): string => {
  if (km === null || km === undefined || Number.isNaN(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString("pt-AO", { maximumFractionDigits: 1 })} km`;
};

/** Tempo desde o último reporte: "há 5 min", "há 2 h"… */
export const formatarTempoRelativo = (minutos?: number | null): string => {
  if (minutos === null || minutos === undefined) return "sem reportes";
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `há ${horas} h`;
};

/** Fiabilidade a 30 dias (só aparece quando o RPC a devolve, i.e. >= 3 reportes). */
export const formatarFiabilidade = (fiabilidade?: number | null): string | null => {
  if (fiabilidade === null || fiabilidade === undefined) return null;
  return `${fiabilidade}%`;
};

export const notasLabel = (tipo: TipoNotas): string => {
  switch (tipo) {
    case "notas_pequenas":
      return "Notas pequenas";
    case "so_notas_grandes":
      return "Só notas grandes";
    default:
      return "Não informado";
  }
};

export const filaLabel = (status: StatusFila): string => {
  switch (status) {
    case "sem_fila":
      return "Sem fila";
    case "fila_pequena":
      return "Fila pequena";
    case "fila_grande":
      return "Fila grande";
    default:
      return "Não informado";
  }
};

export const formatarValorMaximo = (valor?: number | null): string | null => {
  if (valor === null || valor === undefined) return null;
  return `${Math.round(valor).toLocaleString("pt-AO")} Kz`;
};

/** Deep link para navegação no Google Maps. */
export const googleMapsUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lng.toFixed(6)}`;

/** Deep link para navegação no Waze. */
export const wazeUrl = (lat: number, lng: number): string =>
  `https://waze.com/ul?ll=${lat.toFixed(6)},${lng.toFixed(6)}&navigate=yes`;

/** Nível derivado dos pontos (espelho do RPC multicaixa_nivel). */
export const nivelPorPontos = (pontos: number): NivelGuardiao =>
  pontos >= 25 ? "ouro" : pontos >= 10 ? "prata" : pontos >= 1 ? "bronze" : "novato";

/** Filtro de estado usado na aba Explorar. */
export type FiltroEstado = "todos" | EstadoVisivel;

export const filtrarPorEstado = (atms: EstadoMulticaixa[], filtro: FiltroEstado): EstadoMulticaixa[] =>
  filtro === "todos" ? atms : atms.filter((a) => a.estado === filtro);
