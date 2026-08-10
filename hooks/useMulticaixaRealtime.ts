/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { useEffect, useRef } from "react";
import { supabase } from "../services/core/supabaseClient";

type MulticaixaRealtimeTable = "multicaixas" | "reportes_multicaixa";

/**
 * Subscreve alterações (INSERT/UPDATE/DELETE) nas tabelas da Multicaixa via
 * Realtime. Usa uma ref para o callback para não cancelar/resubscrever o
 * canal a cada render.
 */
export const useMulticaixaRealtime = (
  table: MulticaixaRealtimeTable,
  onChange: () => void,
) => {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const channel = supabase
      .channel(`multicaixa-${table}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        () => onChangeRef.current(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);
};
