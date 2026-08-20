import { useState, useEffect } from 'react';

export function useCountUp(targetValue: number, durationMs: number = 800, decimals: number = 1): string {
  const [currentValue, setCurrentValue] = useState<number>(0);

  useEffect(() => {
    if (isNaN(targetValue)) return;
    
    let startTime: number | null = null;
    let animationFrameId: number;

    const startVal = 0;
    const endVal = targetValue;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Smooth ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const val = startVal + (endVal - startVal) * easeProgress;
      setCurrentValue(val);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentValue(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, durationMs]);

  return currentValue.toFixed(decimals);
}
