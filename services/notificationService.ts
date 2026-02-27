/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 * @license Proprietary. Unauthorized copying, modification, or reverse engineering is strictly prohibited.
 */

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
      // Logic for 2 notifications per day limit
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
  }
};
