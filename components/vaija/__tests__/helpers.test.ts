import { describe, it, expect, vi } from "vitest";
import {
  formatPreco,
  tipoVeiculoLabel,
  vehicleIcon,
  formatExpira,
  minutosRestantes,
  buildWhatsAppShare,
  isLotado,
} from "../helpers";
import type { TrajetoAtivo } from "../../../types";

describe("VaiJá helpers", () => {
  describe("formatPreco", () => {
    it("arredonda e formata em Kz", () => {
      expect(formatPreco(500)).toBe("500 Kz");
      expect(formatPreco(500.49)).toBe("500 Kz");
      expect(formatPreco(1249.5)).toBe(`${(1250).toLocaleString("pt-AO")} Kz`);
      expect(formatPreco(1249.5)).toContain("Kz");
      expect(formatPreco(1249.5)).toContain("1");
    });
  });

  describe("tipoVeiculoLabel", () => {
    it("devolve Táxi para taxi e Candongueiro caso contrário", () => {
      expect(tipoVeiculoLabel("taxi")).toBe("Táxi");
      expect(tipoVeiculoLabel("candongueiro")).toBe("Candongueiro");
      expect(tipoVeiculoLabel(undefined)).toBe("Candongueiro");
      expect(tipoVeiculoLabel(null)).toBe("Candongueiro");
    });
  });

  describe("vehicleIcon", () => {
    it("devolve emoji correto por tipo", () => {
      expect(vehicleIcon("taxi")).toBe("🚕");
      expect(vehicleIcon("candongueiro")).toBe("🚐");
      expect(vehicleIcon(undefined)).toBe("🚐");
    });
  });

  describe("formatExpira", () => {
    it("formata a hora no formato HH:MM", () => {
      vi.setSystemTime(new Date("2026-08-09T10:00:00"));
      const output = formatExpira("2026-08-09T14:30:00");
      expect(output).toMatch(/^\d{2}:\d{2}$/);
      vi.useRealTimers();
    });
  });

  describe("minutosRestantes", () => {
    it("devolve 0 quando já expirou", () => {
      vi.setSystemTime(new Date("2026-08-09T12:00:00"));
      expect(minutosRestantes("2026-08-09T10:00:00")).toBe(0);
      vi.useRealTimers();
    });

    it("devolve os minutos restantes aproximados", () => {
      vi.setSystemTime(new Date("2026-08-09T12:00:00"));
      const restantes = minutosRestantes("2026-08-09T12:30:00");
      expect(restantes).toBeGreaterThan(28);
      expect(restantes).toBeLessThanOrEqual(30);
      vi.useRealTimers();
    });
  });

  describe("buildWhatsAppShare", () => {
    const trajeto: TrajetoAtivo = {
      id: "t1",
      motoristaId: "m1",
      modo: "trajeto",
      pontoPartida: "Benfica",
      pontoDestino: "Maianga",
      lugaresTotais: 4,
      lugaresDisponiveis: 3,
      preco: 500,
      status: "ativo",
      criadoEm: "2026-08-09T09:00:00",
      atualizadoEm: "2026-08-09T09:00:00",
      expiraEm: "2026-08-09T10:00:00",
    };

    it("gera link wa.me com o texto codificado", () => {
      const url = buildWhatsAppShare(trajeto);
      expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
      expect(decodeURIComponent(url.split("text=")[1])).toContain("Benfica → Maianga");
      expect(decodeURIComponent(url.split("text=")[1])).toContain("500 Kz");
    });
  });

  describe("isLotado", () => {
    it("devolve true quando o status é lotado", () => {
      expect(isLotado({ ...baseTrajeto(), status: "lotado" })).toBe(true);
    });

    it("devolve true quando não há lugares disponíveis", () => {
      expect(isLotado({ ...baseTrajeto(), lugaresDisponiveis: 0 })).toBe(true);
    });

    it("devolve false quando ainda há lugares", () => {
      expect(isLotado(baseTrajeto())).toBe(false);
    });
  });
});

function baseTrajeto(): TrajetoAtivo {
  return {
    id: "t1",
    motoristaId: "m1",
    modo: "trajeto",
    pontoPartida: "Benfica",
    pontoDestino: "Maianga",
    lugaresTotais: 4,
    lugaresDisponiveis: 3,
    preco: 500,
    status: "ativo",
    criadoEm: "2026-08-09T09:00:00",
    atualizadoEm: "2026-08-09T09:00:00",
    expiraEm: "2026-08-09T10:00:00",
  };
}
