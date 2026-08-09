/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import type { TrajetoAtivo, TipoVeiculo } from "../../types";

export const formatPreco = (value: number): string =>
  `${Math.round(value).toLocaleString("pt-AO")} Kz`;

export const tipoVeiculoLabel = (tipo?: TipoVeiculo | null): string =>
  tipo === "taxi" ? "Táxi" : "Candongueiro";

export const vehicleIcon = (tipo?: TipoVeiculo | null): string =>
  tipo === "taxi" ? "🚕" : "🚐";

/** Hora de expiração local (HH:MM) */
export const formatExpira = (expiraEm: string): string => {
  const d = new Date(expiraEm);
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
};

/** Minutos restantes (pode ser negativo se já passou) */
export const minutosRestantes = (expiraEm: string): number => {
  const diff = new Date(expiraEm).getTime() - Date.now();
  return Math.max(0, Math.round(diff / 60000));
};

/** Link de WhatsApp com o resumo do trajeto (crescimento e lotação rápida) */
export const buildWhatsAppShare = (trajeto: TrajetoAtivo): string => {
  const text = [
    `🚗 VaiJá — ${trajeto.pontoPartida} → ${trajeto.pontoDestino}`,
    `💰 Preço: ${formatPreco(trajeto.preco)}`,
    `🪑 Lugares: ${trajeto.lugaresDisponiveis}/${trajeto.lugaresTotais}`,
    `Sê o primeiro a confirmar no Resolve.AO!`,
  ].join("\n");
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

export const isLotado = (trajeto: TrajetoAtivo): boolean =>
  trajeto.status === "lotado" || trajeto.lugaresDisponiveis <= 0;
