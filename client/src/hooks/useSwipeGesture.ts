import { useRef, useState, useCallback } from 'react';

export function useSwipeGesture(onReveal: () => void, threshold = 80, maxReveal = 120) {
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;

    // Detect gesture angle on first significant move
    if (isHorizontal.current === null) {
      const absDx = Math.abs(deltaX);
      const absDy = Math.abs(deltaY);
      if (absDx < 5 && absDy < 5) return;
      // If angle > 30 degrees from horizontal, let page scroll
      const angle = Math.atan2(absDy, absDx) * (180 / Math.PI);
      isHorizontal.current = angle <= 30;
    }

    if (!isHorizontal.current) return;

    // Swipe left to reveal action panel
    if (deltaX < 0) {
      setTranslateX(Math.max(deltaX, -maxReveal));
    }
    // Swipe right to close already-open card
    if (deltaX > 10 && isRevealed) {
      setTranslateX(0);
      setIsRevealed(false);
    }
  }, [isRevealed, maxReveal]);

  const onTouchEnd = useCallback(() => {
    if (Math.abs(translateX) >= threshold) {
      setTranslateX(-maxReveal);
      setIsRevealed(true);
      onReveal();
    } else {
      setTranslateX(0);
      setIsRevealed(false);
    }
    isHorizontal.current = null;
  }, [translateX, threshold, maxReveal, onReveal]);

  const reset = useCallback(() => {
    setTranslateX(0);
    setIsRevealed(false);
  }, []);

  return {
    translateX,
    isRevealed,
    reset,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
