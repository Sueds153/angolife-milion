/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import { useEffect, useRef } from "react";
import { supabase } from "../services/core/supabaseClient";

type VaiJaRealtimeTable = "trajetos_ativos" | "confirmacoes";

/**
 * Subscreve alterações (INSERT/UPDATE/DELETE) numa tabela do VaiJá via
 * Realtime. Usa uma ref para o callback para não cancelar/resubscrever o
 * canal a cada render.
 */
export const useVaiJaRealtime = (
  table: VaiJaRealtimeTable,
  onChange: () => void,
  filter?: string,
) => {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const channel = supabase
      .channel(`vaija-${table}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        () => onChangeRef.current(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
};
