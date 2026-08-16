import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Intelligent Cooperative Gesture Overlay for Mobile/Touch Devices
 * - On 1-finger touch/drag: allows natural page scrolling; shows "Use two fingers to move the map" only if deliberately dragged (>25px) and not part of a 2-finger gesture.
 * - On 2-finger touch/pinch: enables Leaflet panning and pinch-to-zoom.
 * - Handles finger liftoff gracefully: when one finger lifts after 2-finger pan, a 600ms cooldown prevents accidental overlay popups.
 * - Taps and small touches never trigger the overlay.
 * - On desktop/laptop: normal mouse dragging and scrolling remains active.
 */
export const MapGestureOverlay: React.FC = () => {
  const map = useMap();
  const [showOverlay, setShowOverlay] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTwoFingerGestureActive = useRef(false);
  const lastTwoFingerTimestamp = useRef(0);

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const isTouchDevice = () => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };

    if (!isTouchDevice()) {
      map.dragging.enable();
      return;
    }

    // On touch devices, disable 1-finger dragging by default to allow natural page scrolling
    map.dragging.disable();

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        isTwoFingerGestureActive.current = true;
        lastTwoFingerTimestamp.current = Date.now();
        map.dragging.enable();
        if (map.touchZoom) map.touchZoom.enable();
        setShowOverlay(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else if (e.touches.length === 1) {
        touchStartPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        // If a 2-finger gesture was active recently (within 600ms), don't treat this as a 1-finger intent
        if (Date.now() - lastTwoFingerTimestamp.current < 600) {
          isTwoFingerGestureActive.current = true;
        } else {
          isTwoFingerGestureActive.current = false;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        isTwoFingerGestureActive.current = true;
        lastTwoFingerTimestamp.current = Date.now();
        setShowOverlay(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      // If user was recently using 2 fingers, ignore 1-finger liftoff slide
      if (isTwoFingerGestureActive.current || Date.now() - lastTwoFingerTimestamp.current < 600) {
        setShowOverlay(false);
        return;
      }

      // If 1-finger touch, calculate drag distance to ignore taps or micro-jitters
      if (e.touches.length === 1 && touchStartPos.current) {
        const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
        const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
        const dist = Math.hypot(dx, dy);

        // Only show overlay if user deliberately dragged > 25px across the map
        if (dist > 25) {
          setShowOverlay(true);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setShowOverlay(false);
          }, 1000);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        lastTwoFingerTimestamp.current = Date.now();
      } else if (e.touches.length === 1) {
        // One finger remaining — record timestamp to prevent false 1-finger trigger
        lastTwoFingerTimestamp.current = Date.now();
        map.dragging.disable();
      } else {
        // All fingers lifted
        touchStartPos.current = null;
        map.dragging.disable();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setShowOverlay(false);
          isTwoFingerGestureActive.current = false;
        }, 300);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [map]);

  if (!showOverlay) return null;

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[1px] pointer-events-none transition-opacity duration-300 select-none animate-in fade-in">
      <div className="bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 border border-white/20">
        <span className="text-base">✌️</span>
        <span className="font-sans">Use two fingers to move the map</span>
      </div>
    </div>
  );
};
