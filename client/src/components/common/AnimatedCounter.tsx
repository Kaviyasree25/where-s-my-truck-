import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  // Dynamically scale animation duration based on the magnitude of the number
  const computedDuration = React.useMemo(() => {
    if (duration !== undefined) return duration;
    const absVal = Math.abs(value);
    if (absVal <= 5) return 380; // Super snappy for single digits (1, 2, 4...)
    if (absVal <= 20) return 520; // Crisp for small numbers (16, 20...)
    if (absVal <= 100) return 720; // Medium duration for percentages (21%, 85%...)
    if (absVal <= 1000) return 950;
    return 1200; // Rich rolling count-up for thousands ($18,450...)
  }, [value, duration]);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;
    const endValue = value;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / computedDuration, 1);

      // Dynamic custom easing: fast initial ramp-up + gentle settling
      const easeOutProgress = 1 - Math.pow(1 - progress, 3.2);
      const current = startValue + (endValue - startValue) * easeOutProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, computedDuration]);

  const formatted = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span className={`tabular-nums inline-block ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
