/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 */

import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EstadoMulticaixa } from "../../types";
import { estadoClasses, estadoEmoji, estadoLabel, formatarDistancia, formatarTempoRelativo, googleMapsUrl } from "./helpers";

interface MulticaixaMapProps {
  atms: EstadoMulticaixa[];
  center: { lat: number; lng: number };
  onReport: (atm: EstadoMulticaixa) => void;
}

const iconeAtm = (estado: EstadoMulticaixa["estado"], confirmado: boolean): L.DivIcon => {
  const { marker } = estadoClasses(estado);
  const ring = confirmado ? "" : "box-shadow: 0 0 0 2px rgba(148,163,184,0.6), 0 0 0 6px rgba(148,163,184,0.15); border: 2px dashed rgba(100,116,139,0.9);";
  const style = `background:${marker}; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-size:13px; border:2px solid #fff; ${ring}`;
  return L.divIcon({
    html: `<div style="${style}">${estadoEmoji(estado)}</div>`,
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16],
  });
};

export const MulticaixaMap: React.FC<MulticaixaMapProps> = ({ atms, center, onReport }) => {
  const marcadores = useMemo(
    () => atms.filter((a) => a.latitude !== null && a.longitude !== null),
    [atms],
  );

  return (
    <div className="rounded-3xl overflow-hidden border border-orange-500/10 shadow-sm relative z-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom={false}
        className="h-[420px] w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {marcadores.map((atm) => (
          <Marker
            key={atm.id}
            position={[atm.latitude as number, atm.longitude as number]}
            icon={iconeAtm(atm.estado, atm.confirmado)}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-black text-slate-900 text-xs uppercase tracking-tight mb-0.5">{atm.nome}</p>
                <p className="text-[10px] font-bold text-slate-500 mb-2">
                  {estadoLabel(atm.estado)}
                  {atm.distancia_km !== null && atm.distancia_km !== undefined
                    ? ` · ${formatarDistancia(atm.distancia_km)}`
                    : ""}
                  {atm.min_ultimo_report !== null && atm.min_ultimo_report !== undefined
                    ? ` · ${formatarTempoRelativo(atm.min_ultimo_report)}`
                    : ""}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onReport(atm)}
                    className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg"
                  >
                    Reportar
                  </button>
                  {atm.latitude !== null && atm.longitude !== null && (
                    <a
                      href={googleMapsUrl(atm.latitude, atm.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg"
                    >
                      Maps
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
