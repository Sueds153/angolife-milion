import { Ad } from './ads.service';

export type PopupFormat = 'interstitial' | 'rewarded';

/** Campos de creative partilhados pelos overlays (compatível com OverlayCreative). */
export interface AdCreative {
  image_url?: string;
  title?: string;
  company_name?: string;
  video_url?: string;
  media_type?: 'image' | 'video';
  link?: string;
  duration_seconds?: number;
}

const matchesLocation = (ad: Ad, page: string): boolean =>
  ad.location === 'all' || ad.location === page;

const isPopupFormat = (format: string): format is PopupFormat =>
  format === 'interstitial' || format === 'rewarded';

const pickRandom = (ads: Ad[]): Ad | null => {
  if (ads.length === 0) return null;
  return ads[Math.floor(Math.random() * ads.length)];
};

/**
 * Seleciona o melhor anúncio activo para um slot com matching hierárquico:
 *  1. formato exacto (ex.: rewarded)
 *  2. format='all' (universal — banners e popups)
 *  3. só popups: qualquer activo na página (fallback — o admin pode ter
 *     publicado apenas um banner e este slot precisa de creative)
 * Location: exacta → 'all'. Rotação aleatória entre candidatos do mesmo tier.
 */
export function selectAdForPlacement(
  ads: Ad[],
  opts: { format: Ad['format']; page: string }
): Ad | null {
  const eligible = ads.filter(a => a.is_active && matchesLocation(a, opts.page));
  if (eligible.length === 0) return null;

  const exact = eligible.filter(a => a.format === opts.format);
  const universal = eligible.filter(a => a.format === 'all');

  return (
    pickRandom(exact) ??
    pickRandom(universal) ??
    (isPopupFormat(opts.format) ? pickRandom(eligible) : null)
  );
}

/** Converte um Ad seleccionado no creative usado pelos overlays. */
export function creativeFromAd(ad: Ad | null): AdCreative | null {
  if (!ad) return null;
  return {
    image_url: ad.image_url,
    title: ad.title || ad.company_name,
    company_name: ad.company_name,
    video_url: ad.video_url,
    media_type: ad.media_type,
    link: ad.link,
    duration_seconds: ad.duration_seconds,
  };
}
