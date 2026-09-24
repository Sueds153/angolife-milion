import { useState } from 'react';

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

    // 1º e 2º cliques passam sem anúncio; o 3º pede o rewarded
    if (newCount >= 3) {
      if (onRequestReward) {
        setIsAdLoading(true);
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
              // Reseta o contador para que o utilizador não fique preso num loop de anúncios
              sessionStorage.setItem('jobs_view_count', '0');
              setViewCount(0);
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
