import { describe, it, expect, vi, beforeEach } from "vitest";
import { VaiJaService } from "../vaija.service";

const hoisted = vi.hoisted(() => {
  const state = {
    result: { data: null as unknown, error: null as unknown },
    rpcResult: { data: null as unknown, error: null as unknown },
    uploadResult: { data: null as unknown, error: null as unknown },
  };

  function createBuilder(terminal: () => { data: unknown; error: unknown }) {
    const builder: Record<string, (...args: unknown[]) => unknown> = {};
    const makeStep = () => () => builder;
    const methodNames = [
      "select", "eq", "in", "order", "limit", "insert", "update",
      "upsert", "delete", "rpc", "from",
    ];
    for (const name of methodNames) {
      builder[name] = makeStep();
    }
    builder.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(terminal()).then(onFulfilled, onRejected);
    builder.single = async () => terminal();
    builder.maybeSingle = async () => terminal();
    return builder;
  }

  const supabase = {
    from: vi.fn(() => createBuilder(() => state.result)),
    rpc: vi.fn(() => createBuilder(() => state.rpcResult)),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => state.uploadResult),
      })),
    },
  };

  return { state, supabase };
});

const mockSupabase = hoisted.supabase;

vi.mock("../../core/supabaseClient", () => ({
  supabase: hoisted.supabase,
}));

describe("VaiJaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.state.result = { data: null, error: null };
    hoisted.state.rpcResult = { data: null, error: null };
    hoisted.state.uploadResult = { data: null, error: null };
  });

  it("getTrajetosAtivos devolve lista quando nÃ£o hÃ¡ erro", async () => {
    const rows = [{ id: "t1" }];
    hoisted.state.result = { data: rows, error: null };

    const result = await VaiJaService.getTrajetosAtivos();

    expect(mockSupabase.from).toHaveBeenCalledWith("trajetos_ativos");
    expect(result).toEqual(rows);
  });

  it("getTrajetosAtivos devolve [] em caso de erro", async () => {
    hoisted.state.result = { data: null, error: { message: "erro" } };
    await expect(VaiJaService.getTrajetosAtivos()).resolves.toEqual([]);
  });

  it("getTrajetoById devolve null quando nÃ£o hÃ¡ dados", async () => {
    hoisted.state.result = { data: null, error: null };
    await expect(VaiJaService.getTrajetoById("x")).resolves.toBeNull();
  });

  it("publicarTrajeto devolve o id e sem erro", async () => {
    hoisted.state.result = { data: { id: "novo-id" }, error: null };
    const out = await VaiJaService.publicarTrajeto({
      motoristaId: "m1",
      modo: "trajeto",
      pontoPartida: "Benfica",
      pontoDestino: "Maianga",
      lugaresTotais: 4,
      preco: 500,
    });
    expect(out).toEqual({ id: "novo-id", error: null });
  });

  it("publicarTrajeto devolve erro quando falha", async () => {
    hoisted.state.result = { data: null, error: { message: "sem permissÃ£o" } };
    const out = await VaiJaService.publicarTrajeto({
      motoristaId: "m1",
      modo: "trajeto",
      pontoPartida: "Benfica",
      pontoDestino: "Maianga",
      lugaresTotais: 4,
      preco: 500,
    });
    expect(out).toEqual({ id: null, error: "sem permissÃ£o" });
  });

  it("confirmarLugar devolve ok:true quando a RPC responde ok", async () => {
    hoisted.state.rpcResult = { data: { ok: true }, error: null };
    await expect(VaiJaService.confirmarLugar("t1")).resolves.toEqual({
      ok: true,
      error: null,
    });
  });

  it("confirmarLugar devolve o erro quando a RPC responde erro", async () => {
    hoisted.state.rpcResult = { data: null, error: { message: "lotado" } };
    await expect(VaiJaService.confirmarLugar("t1")).resolves.toEqual({
      ok: false,
      error: "lotado",
    });
  });

  it("getMinhasViagens mapeia o embed trajeto e normaliza a confirmaÃ§Ã£o", async () => {
    hoisted.state.result = {
      data: [
        {
          id: "c1",
          trajeto_id: "t1",
          passageiro_id: "p1",
          preco_acordado: 400,
          status: "confirmado",
          criado_em: "2026-08-09T09:00:00",
          trajeto: { id: "t1", pontoDestino: "Maianga" },
        },
      ],
      error: null,
    };

    const out = await VaiJaService.getMinhasViagens("p1");

    expect(out).toHaveLength(1);
    expect(out[0].confirmacao).toEqual({
      id: "c1",
      trajetoId: "t1",
      passageiroId: "p1",
      precoAcordado: 400,
      status: "confirmado",
      criadoEm: "2026-08-09T09:00:00",
    });
    expect(out[0].trajeto).toEqual({ id: "t1", pontoDestino: "Maianga" });
  });

  it("getMotoristasPublico devolve [] para lista vazia sem chamar a API", async () => {
    await expect(VaiJaService.getMotoristasPublico([])).resolves.toEqual([]);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("uploadDriverDocument devolve o path do upload", async () => {
    const file = new File([""], "bi.jpg", { type: "image/jpeg" });
    hoisted.state.uploadResult = { data: { path: "u1/123.bi.jpg" }, error: null };
    const path = await VaiJaService.uploadDriverDocument("u1", file);
    expect(path).toBe("u1/123.bi.jpg");
    expect(mockSupabase.storage.from).toHaveBeenCalledWith("documentos-motorista");
  });

  it("uploadDriverDocument devolve null quando o upload falha", async () => {
    const file = new File([""], "bi.jpg", { type: "image/jpeg" });
    hoisted.state.uploadResult = { data: null, error: { message: "bucket nÃ£o existe" } };
    await expect(VaiJaService.uploadDriverDocument("u1", file)).resolves.toBeNull();
  });

  it("criarPedido devolve id em caso de sucesso", async () => {
    hoisted.state.result = { data: { id: "pd1" }, error: null };
    const out = await VaiJaService.criarPedido({
      passageiroId: "p1",
      pontoPartida: "Benfica",
      pontoDestino: "Maianga",
    });
    expect(out).toEqual({ id: "pd1", error: null });
  });
});
