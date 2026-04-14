import { useState } from 'react';
import { AD_CONFIG } from '../constants/ads';

interface UseAdsProps {
  onShowInterstitial?: (callback: () => void) => void;
  onRequestReward?: (onSuccess: () => void, onCancel: () => void) => void;
}

export const useAds = ({ onShowInterstitial, onRequestReward }: UseAdsProps) => {
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewCount, setViewCount] = useState<number>(() => {
    return Number(sessionStorage.getItem('jobs_view_count')) || 0;
  });

  const executeWithRewardAd = (action: () => void) => {
    const currentCount = Number(sessionStorage.getItem('jobs_view_count')) || 0;
    const newCount = currentCount + 1;

    // RULE: Use threshold from central config
    if (newCount >= AD_CONFIG.REWARD_AD_THRESHOLD) {
      if (onRequestReward) {
        setIsAdLoading(true);
        // Delay to show the loading screen
        setTimeout(() => {
          onRequestReward(
            () => {
              setIsAdLoading(false);
              sessionStorage.setItem('jobs_view_count', '0');
              setViewCount(0);
              action();
            },
            () => {
              setIsAdLoading(false);
              alert('Assista ao vídeo completo para desbloquear este recurso.');
            }
          );
        }, 1000);
      } else {
        // Fallback
        action();
        sessionStorage.setItem('jobs_view_count', '0');
        setViewCount(0);
      }
    } else {
      sessionStorage.setItem('jobs_view_count', newCount.toString());
      setViewCount(newCount);
      action();
    }
  };

  const executeWithInterstitial = (action: () => void) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onShowInterstitial) {
        onShowInterstitial(action);
      } else {
        action();
      }
    }, 500);
  };

  return {
    isAdLoading,
    isProcessing,
    viewCount,
    executeWithRewardAd,
    executeWithInterstitial
  };
};
