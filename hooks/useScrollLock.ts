import { useEffect } from 'react';

let scrollLockCount = 0;
let originalOverflow: string | null = null;

export const useScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;

    if (scrollLockCount === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    scrollLockCount += 1;

    return () => {
      scrollLockCount -= 1;
      if (scrollLockCount <= 0) {
        scrollLockCount = 0;
        document.body.style.overflow = originalOverflow ?? '';
        originalOverflow = null;
      }
    };
  }, [locked]);
};
