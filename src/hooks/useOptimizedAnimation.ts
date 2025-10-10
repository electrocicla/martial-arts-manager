import { useRef, useEffect, useCallback } from 'react';

/**
 * Optimized Animation Hook
 * Provides efficient animation loop with proper cleanup and performance monitoring
 */

export interface AnimationConfig {
  enabled?: boolean;
  maxFrameTime?: number;
}

export const useOptimizedAnimation = (
  callback: (deltaTime: number) => void,
  config: AnimationConfig = {}
) => {
  const {
    enabled = true,
    maxFrameTime = 16.67 // ~60fps
  } = config;

  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const lastFPSTimeRef = useRef(0);
  const fpsRef = useRef(60);

  const animate = useCallback((time: number) => {
    if (!enabled) return;

    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;

      // FPS calculation
      frameCountRef.current++;
      if (time - lastFPSTimeRef.current >= 1000) {
        fpsRef.current = frameCountRef.current;
        frameCountRef.current = 0;
        lastFPSTimeRef.current = time;
      }

      // Only update if we haven't exceeded max frame time (prevent spiral of death)
      if (deltaTime < maxFrameTime) {
        callback(deltaTime);
      }
    }

    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [enabled, maxFrameTime, callback]);

  useEffect(() => {
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate, enabled]);

  return {
    fps: fpsRef.current,
    isAnimating: !!requestRef.current
  };
};