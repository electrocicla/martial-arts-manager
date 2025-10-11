import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useDevicePerformance } from '../../hooks/useDevicePerformance';
import { useOptimizedAnimation } from '../../hooks/useOptimizedAnimation';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { createParticlePool, updateParticles, respawnParticles, type Particle } from '../../lib/particlePool';
import { logPerformanceMetrics, measureRenderTime } from '../../lib/performanceMonitor';

interface VisualParticle extends Particle {
  color: string;
}

/**
 * MartialArtsParticles Component
 * Ultra-optimized particle system with aggressive mobile performance tuning
 */
const MartialArtsParticles: React.FC = () => {
  const performance = useDevicePerformance();
  const particlePoolRef = useRef<VisualParticle[]>([]);
  const [particles, setParticles] = useState<VisualParticle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef<number>(0);
  const frameSkipRef = useRef<number>(0);

  // More aggressive intersection observer for better performance
  const { shouldRender } = useIntersectionObserver({
    threshold: 0,
    rootMargin: performance.isMobile ? '300px' : '150px', // Start rendering later
    triggerOnce: false
  });

  // Dynamic particle configuration based on device performance
  const particleConfig = useMemo(() => {
    if (performance.isLowEnd || performance.isMobile) {
      return {
        poolSize: performance.particleCount,
        maxLife: 6000, // Shorter life for faster recycling
        speedRange: [0.1, 0.4] as [number, number], // Slower for less CPU
        sizeRange: [1, 3] as [number, number], // Smaller particles
        opacityRange: [0.15, 0.35] as [number, number],
        updateThrottle: 2 // Update every 2 frames on mobile
      };
    }

    return {
      poolSize: performance.particleCount,
      maxLife: 10000,
      speedRange: [0.2, 0.8] as [number, number],
      sizeRange: [1.5, 5] as [number, number],
      opacityRange: [0.2, 0.4] as [number, number],
      updateThrottle: 1 // Update every frame on desktop
    };
  }, [performance]);

  // Initialize particle pool with optimized settings
  useEffect(() => {
    if (!shouldRender) return;

    const colors = performance.isLowEnd
      ? ['#DC2626', '#B91C1C'] // Only 2 colors for low-end devices
      : performance.isMobile
      ? ['#000000', '#DC2626', '#B91C1C'] // 3 colors for mobile
      : ['#000000', '#DC2626', '#B91C1C', '#7F1D1D']; // 4 colors for desktop

    const physicsParticles = createParticlePool(particleConfig);

    particlePoolRef.current = physicsParticles.map(particle => ({
      ...particle,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setParticles([...particlePoolRef.current]);

    const handleResize = () => {
      if (particlePoolRef.current.length > 0) {
        particlePoolRef.current = respawnParticles(particlePoolRef.current, {
          width: window.innerWidth,
          height: window.innerHeight
        }) as VisualParticle[];
        setParticles([...particlePoolRef.current]);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [particleConfig, shouldRender, performance.isLowEnd, performance.isMobile]);

  // Ultra-optimized animation loop with frame skipping
  const animationCallback = React.useCallback((deltaTime: number) => {
    if (!shouldRender || particlePoolRef.current.length === 0) return;

    // Frame skipping for mobile performance
    frameSkipRef.current++;
    if (frameSkipRef.current < particleConfig.updateThrottle) return;
    frameSkipRef.current = 0;

    const renderTime = measureRenderTime(() => {
      particlePoolRef.current = updateParticles(particlePoolRef.current, deltaTime * particleConfig.updateThrottle, {
        width: window.innerWidth,
        height: window.innerHeight
      }) as VisualParticle[];

      // Only update state if particles actually changed (reduce re-renders)
      const activeParticles = particlePoolRef.current.filter(p => p.active);
      if (activeParticles.length !== particles.length ||
          activeParticles.some((p, i) => particles[i]?.id !== p.id)) {
        setParticles([...activeParticles]);
      }
    });

    // Reduced logging frequency for performance
    if (window.performance.now() - lastUpdateRef.current > 2000) {
      logPerformanceMetrics({
        fps: Math.round(1000 / deltaTime),
        renderTime,
        particleCount: particlePoolRef.current.filter(p => p.active).length
      });
      lastUpdateRef.current = window.performance.now();
    }
  }, [shouldRender, particleConfig.updateThrottle, particles]);

  const { fps } = useOptimizedAnimation(animationCallback, {
    enabled: performance.animationEnabled && shouldRender,
    maxFrameTime: performance.isMobile ? 50 : 25 // 20fps mobile, 40fps desktop for particles
  });

  // Early return for non-visible or disabled animations
  if (!shouldRender || !performance.animationEnabled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className='fixed inset-0 pointer-events-none overflow-hidden z-0'
      style={{
        // Force GPU acceleration
        transform: 'translateZ(0)',
        willChange: 'transform',
        // Aggressive containment for mobile
        contain: performance.isMobile ? 'layout style paint size' : 'layout style paint'
      }}
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          className='absolute'
          style={{
            left: particle.x,
            top: particle.y,
            // GPU acceleration hints
            transform: 'translateZ(0)',
            willChange: 'transform',
            // Aggressive containment
            contain: performance.isMobile ? 'layout style paint' : 'none'
          }}
        >
          {/* Main particle - simplified rendering */}
          <div
            className='rounded-full'
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              // Remove expensive effects on mobile
              filter: performance.isLowEnd ? 'none' : 'blur(0.2px)',
              boxShadow: performance.isLowEnd
                ? 'none'
                : `0 0 ${particle.size}px ${particle.color}12`,
            }}
          />

          {/* Glow effect - only on capable devices and reduced frequency */}
          {!performance.isLowEnd && !performance.reducedMotion && particle.id % 4 === 0 && (
            <div
              className='absolute inset-0 rounded-full'
              style={{
                backgroundColor: particle.color,
                filter: `blur(${particle.size * 0.3}px)`,
                opacity: particle.opacity * 0.06,
              }}
            />
          )}
        </div>
      ))}

      {/* Performance debug info in development - reduced frequency */}
      {import.meta.env.DEV && (
        <div className='fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50'>
          FPS: {fps} | Particles: {particles.length}
        </div>
      )}
    </div>
  );
};

export default MartialArtsParticles;
