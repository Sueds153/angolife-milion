import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Abre uma URL externa.
 * Em ambiente nativo (Capacitor) usa o browser do sistema / in-app browser.
 * No web usa window.open como fallback.
 */
export async function openExternal(url: string): Promise<boolean> {
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