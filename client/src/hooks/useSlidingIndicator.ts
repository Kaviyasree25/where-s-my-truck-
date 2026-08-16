import { useState, useRef, useEffect } from 'react';

/**
 * High-performance sliding indicator hook.
 * Uses GPU-accelerated translate3d + exact width/height for silky smooth 60/120fps transitions
 * with zero layout distortion, zero ghost overlays, and 100% crisp rounded corners.
 */
export function useSlidingIndicator<T>(activeKey: T) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    transform: string;
    width: number;
    height: number;
    opacity: number;
  }>({
    transform: 'translate3d(0, 0, 0)',
    width: 0,
    height: 0,
    opacity: 0,
  });

  const update = () => {
    if (!containerRef.current) return;
    const target = containerRef.current.querySelector<HTMLElement>(
      `[data-active="true"]`
    );
    if (target) {
      setIndicatorStyle({
        transform: `translate3d(${target.offsetLeft}px, ${target.offsetTop}px, 0)`,
        width: target.offsetWidth,
        height: target.offsetHeight,
        opacity: 1,
      });
    }
  };

  useEffect(() => {
    // requestAnimationFrame ensures the DOM is painted and fonts/layouts are measured accurately
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
    };
  }, [activeKey]);

  return { containerRef, indicatorStyle, updateIndicator: update };
}
