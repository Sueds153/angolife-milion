import React, { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const key = pathname + search;

    if (navigationType === 'POP') {
      const saved = scrollPositions.get(key);
      requestAnimationFrame(() => window.scrollTo(0, saved ?? 0));
    } else {
      window.scrollTo(0, 0);
    }

    const onScroll = () => {
      scrollPositions.set(key, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname, search, navigationType]);

  return null;
};
