/**
 * Ad Service - Centralized Ad Management
 * Handles ad capping, reward tracking, and display logic
 */

const AD_STORAGE_KEYS = {
  LAST_INTERSTITIAL: 'ANGOLIFE_LAST_INTERSTITIAL',
  REWARD_COMPLETED: 'ANGOLIFE_REWARD_COMPLETED',
  REWARD_TIMESTAMP: 'ANGOLIFE_REWARD_TIMESTAMP'
};

const INTERSTITIAL_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const REWARD_VALIDITY = 10 * 60 * 1000; // Reward is valid for 10 minutes after completion

export const AdService = {
  /**
   * Check if we can show an interstitial ad (respects 2-hour capping)
   */
  canShowInterstitial(): boolean {
    const lastShown = localStorage.getItem(AD_STORAGE_KEYS.LAST_INTERSTITIAL);
    
    if (!lastShown) {
      return true;
    }
    
    const timeSinceLastAd = Date.now() - parseInt(lastShown, 10);
    return timeSinceLastAd > INTERSTITIAL_COOLDOWN;
  },

  /**
   * Record that an interstitial ad was shown
   */
  recordInterstitialShown(): void {
    localStorage.setItem(AD_STORAGE_KEYS.LAST_INTERSTITIAL, Date.now().toString());
  },

  /**
   * Show a rewarded ad (placeholder - integrate with actual ad provider)
   * Returns a promise that resolves when user completes the ad
   */
  async showRewardedAd(): Promise<boolean> {
    return new Promise((resolve) => {
      // PLACEHOLDER: Replace with actual ad provider SDK
      // Example: Google AdMob rewarded ad
      console.log('🎬 Rewarded ad would show here');
      
      // Simulate ad watching (15 seconds)
      setTimeout(() => {
        console.log('✅ Rewarded ad completed');
        resolve(true);
      }, 1000); // In production, this would be triggered by ad SDK callback
    });
  },

  /**
   * Mark that user completed a rewarded ad
   */
  markRewardCompleted(): void {
    localStorage.setItem(AD_STORAGE_KEYS.REWARD_COMPLETED, 'true');
    localStorage.setItem(AD_STORAGE_KEYS.REWARD_TIMESTAMP, Date.now().toString());
  },

  /**
   * Check if user has an active reward (completed ad recently)
   */
  hasActiveReward(): boolean {
    const completed = localStorage.getItem(AD_STORAGE_KEYS.REWARD_COMPLETED);
    const timestamp = localStorage.getItem(AD_STORAGE_KEYS.REWARD_TIMESTAMP);
    
    if (!completed || !timestamp) {
      return false;
    }
    
    const timeSinceReward = Date.now() - parseInt(timestamp, 10);
    return timeSinceReward < REWARD_VALIDITY;
  },

  /**
   * Clear reward state (call after using the priority feature)
   */
  resetRewardState(): void {
    localStorage.removeItem(AD_STORAGE_KEYS.REWARD_COMPLETED);
    localStorage.removeItem(AD_STORAGE_KEYS.REWARD_TIMESTAMP);
  },

  /**
   * Show interstitial ad (placeholder)
   */
  async showInterstitial(): Promise<void> {
    if (!this.canShowInterstitial()) {
      console.log('⏳ Interstitial capped - too soon');
      return;
    }

    // PLACEHOLDER: Replace with actual ad provider SDK
    console.log('📺 Interstitial ad would show here');
    
    // Simulate ad display
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.recordInterstitialShown();
  },

  /**
   * Get time remaining until next interstitial can be shown
   */
  getTimeUntilNextInterstitial(): number {
    const lastShown = localStorage.getItem(AD_STORAGE_KEYS.LAST_INTERSTITIAL);
    
    if (!lastShown) {
      return 0;
    }
    
    const timeSinceLastAd = Date.now() - parseInt(lastShown, 10);
    const timeRemaining = INTERSTITIAL_COOLDOWN - timeSinceLastAd;
    
    return Math.max(0, timeRemaining);
  }
};
