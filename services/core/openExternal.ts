import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { isSafeExternalUrl, isSafeHttpUrl } from '../utils/safeUrl';

/**
 * Abre uma URL externa.
 * Em ambiente nativo (Capacitor) usa o browser do sistema / in-app browser.
 * No web usa window.open como fallback.
 * Aceita http/https (navegador) e mailto:/tel: (handler do sistema).
 */
export async function openExternal(url: string): Promise<boolean> {
  if (!isSafeExternalUrl(url)) return false;

  // mailto:/tel: não é página web — em web há que atribuir à location para
  // disparar o handler do sistema (window.open é bloqueado/pop-up).
  if (!isSafeHttpUrl(url)) {
    if (Capacitor.isNativePlatform()) {
      try {
        await Browser.open({ url });
        return true;
      } catch {
        // continua para o fallback web
      }
    }
    window.location.href = url;
    return true;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url });
      return true;
    } catch {
      return false;
    }
  }

  const win = window.open(url, '_blank', 'noopener,noreferrer');
  return !!win;
}