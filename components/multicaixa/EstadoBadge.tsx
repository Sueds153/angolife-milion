/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import React from "react";
import { estadoClasses, estadoEmoji, estadoLabel, type EstadoVisivel } from "./helpers";

interface EstadoBadgeProps {
  estado: EstadoVisivel;
  confirmado?: boolean;
}

export const EstadoBadge: React.FC<EstadoBadgeProps> = ({ estado, confirmado }) => {
  const { badge, dot } = estadoClasses(estado);
  return (
    <span
      title={confirmado ? "Estado confirmado por vários utilizadores" : "Ainda não confirmado"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${badge} ${confirmado ? "" : "ring-2 ring-dashed ring-offset-0 ring-current/30"}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${confirmado ? "" : "animate-pulse"}`} />
      {estadoEmoji(estado)} {estadoLabel(estado)}
    </span>
  );
};
