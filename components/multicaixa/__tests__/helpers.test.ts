import { describe, it, expect } from "vitest";

import {
  estadoLabel,
  estadoEmoji,
  estadoClasses,
  nivelLabel,
  nivelClasses,
  nivelEmoji,
  formatarDistancia,
  formatarTempoRelativo,
  formatarFiabilidade,
  notasLabel,
  filaLabel,
  formatarValorMaximo,
  googleMapsUrl,
  wazeUrl,
  nivelPorPontos,
  filtrarPorEstado,
} from "../helpers";
import type { EstadoMulticaixa } from "../../../types";

describe("multicaixa helpers", () => {
  it("rotula estados de caixa", () => {
    expect(estadoLabel("tem_dinheiro")).toBe("Tem dinheiro");
    expect(estadoLabel("sem_dinheiro")).toBe("Sem dinheiro");
    expect(estadoLabel("avariado")).toBe("Avariado");
    expect(estadoLabel("desconhecido")).toBe("Desconhecido");
  });

  it("devolve emoji do estado", () => {
    expect(estadoEmoji("tem_dinheiro")).toBe("💰");
    expect(estadoEmoji("sem_dinheiro")).toBe("🚫");
    expect(estadoEmoji("avariado")).toBe("🔧");
    expect(estadoEmoji("desconhecido")).toBe("❓");
  });

  it("devolve classes de estado", () => {
    const ok = estadoClasses("tem_dinheiro");
    expect(ok.marker).toBe("#10b981");
    const bad = estadoClasses("sem_dinheiro");
    expect(bad.marker).toBe("#ef4444");
  });

  it("rotula níveis", () => {
    expect(nivelLabel("ouro")).toBe("Ouro");
    expect(nivelLabel("prata")).toBe("Prata");
    expect(nivelLabel("bronze")).toBe("Bronze");
    expect(nivelLabel("outro")).toBe("Novato");
  });

  it("devolve emoji do nível", () => {
    expect(nivelEmoji("ouro")).toBe("🥇");
    expect(nivelEmoji("prata")).toBe("🥈");
    expect(nivelEmoji("bronze")).toBe("🥉");
    expect(nivelEmoji("outro")).toBe("🌱");
  });

  it("devolve classes do nível", () => {
    expect(nivelClasses("ouro")).toContain("amber");
    expect(nivelClasses("novato")).toContain("slate");
  });

  it("deriva nível a partir dos pontos", () => {
    expect(nivelPorPontos(0)).toBe("novato");
    expect(nivelPorPontos(5)).toBe("bronze");
    expect(nivelPorPontos(10)).toBe("prata");
    expect(nivelPorPontos(25)).toBe("ouro");
  });

  it("formata distâncias", () => {
    expect(formatarDistancia(0.45)).toBe("450 m");
    expect(formatarDistancia(1.2)).toBe("1,2 km");
    expect(formatarDistancia(null)).toBe("—");
    expect(formatarDistancia(undefined)).toBe("—");
  });

  it("formata tempo relativo", () => {
    expect(formatarTempoRelativo(null)).toBe("sem reportes");
    expect(formatarTempoRelativo(0)).toBe("agora");
    expect(formatarTempoRelativo(5)).toBe("há 5 min");
    expect(formatarTempoRelativo(90)).toBe("há 1 h");
  });

  it("formata fiabilidade", () => {
    expect(formatarFiabilidade(null)).toBeNull();
    expect(formatarFiabilidade(undefined)).toBeNull();
    expect(formatarFiabilidade(87)).toBe("87%");
  });

  it("rotula notas e fila", () => {
    expect(notasLabel("notas_pequenas")).toBe("Notas pequenas");
    expect(notasLabel("so_notas_grandes")).toBe("Só notas grandes");
    expect(filaLabel("sem_fila")).toBe("Sem fila");
    expect(filaLabel("fila_pequena")).toBe("Fila pequena");
    expect(filaLabel("fila_grande")).toBe("Fila grande");
  });

  it("formata valor máximo", () => {
    expect(formatarValorMaximo(null)).toBeNull();
    expect(formatarValorMaximo(50000)).toBe("50\u00A0000 Kz");
  });

  it("gera deep links de navegação", () => {
    expect(googleMapsUrl(-8.839, 13.2894)).toContain("maps/dir");
    expect(wazeUrl(-8.839, 13.2894)).toContain("waze.com/ul");
  });

  it("filtra ATMs por estado", () => {
    const atms = [
      { id: "a", estado: "tem_dinheiro" },
      { id: "b", estado: "sem_dinheiro" },
    ] as EstadoMulticaixa[];
    expect(filtrarPorEstado(atms, "todos")).toHaveLength(2);
    expect(filtrarPorEstado(atms, "tem_dinheiro")).toHaveLength(1);
    expect(filtrarPorEstado(atms, "avariado")).toHaveLength(0);
  });
});
