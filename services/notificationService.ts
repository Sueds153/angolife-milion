/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 * @license Proprietary. Unauthorized copying, modification, or reverse engineering is strictly prohibited.
 */

import { supabase } from './supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const NotificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  sendNativeNotification: (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const sentinel = `notif_count_${today}`;
      const currentCount = Number(localStorage.getItem(sentinel)) || 0;

      if (currentCount >= 2) {
        console.log('Push notification skipped: Daily limit reached (2/2).');
        return;
      }

      const options: any = {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
      };
      
      new Notification(title, options);
      localStorage.setItem(sentinel, (currentCount + 1).toString());
    }
  },

  checkPermission: (): NotificationPermission => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  // Web Push Integration
  initWebPush: async (userId: string | undefined) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push não é suportado neste navegador.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription && userId) {
        // Garantir que a subscrição está atualizada no Supabase
        await NotificationService.saveSubscriptionToDb(userId, subscription);
      }
      
      return subscription;
    } catch (error) {
      console.error('Erro ao inicializar Web Push:', error);
      return null;
    }
  },

  isSubscribed: async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  },

  subscribeUser: async (userId: string) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VITE_VAPID_PUBLIC_KEY não configurada.');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: NotificationService.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      await NotificationService.saveSubscriptionToDb(userId, subscription);
      return subscription;
    } catch (error) {
      console.error('Falha ao subscrever utilizador:', error);
      throw error;
    }
  },

  unsubscribeUser: async (userId: string) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Erro ao cancelar subscrição:', error);
    }
  },

  saveSubscriptionToDb: async (userId: string, subscription: PushSubscription) => {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription.toJSON(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) console.error('Erro ao guardar subscrição no Supabase:', error);
  },

  urlBase64ToUint8Array: (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
};
