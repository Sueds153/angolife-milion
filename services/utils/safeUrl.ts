/** Parse uma URL e só aceita http/https. Devolve null para schemes perigosos. */
export function parseSafeHttpUrl(url?: string | null): URL | null {
  if (!url) return null;
  try {
    const u = new URL(String(url).trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u;
  } catch {
    return null;
  }
}

/** URL absoluta http(s) ou null se inválida/insegura. */
export function safeHttpUrl(url?: string | null): string | null {
  return parseSafeHttpUrl(url)?.href ?? null;
}

export function isSafeHttpUrl(url?: string | null): boolean {
  return parseSafeHttpUrl(url) !== null;
}

/** Schemes de contacto que não carregam recursos mas abrem apps do sistema. */
const CONTACT_PROTOCOLS = ['mailto:', 'tel:'];

/**
 * URL segura para abrir para fora: http/https (navegador) ou mailto/tel
 * (handler do sistema). Recusa javascript:, data:, file:, etc.
 */
export function isSafeExternalUrl(url?: string | null): boolean {
  if (!url) return false;
  if (isSafeHttpUrl(url)) return true;
  try {
    const protocol = new URL(String(url).trim()).protocol.toLowerCase();
    return CONTACT_PROTOCOLS.includes(protocol);
  } catch {
    return false;
  }
}
