import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
 * Optimized particle system with recycling, GPU acceleration, and mobile performance
 */
const MartialArtsParticles: React.FC = () => {
  const performance = useDevicePerformance();
  const particlePoolRef = useRef<VisualParticle[]>([]);
  const [particles, setParticles] = useState<VisualParticle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldRender } = useIntersectionObserver({
    threshold: 0,
    rootMargin: '100px',
    triggerOnce: false
  });

  // Initialize particle pool with visual properties
  useEffect(() => {
    if (!shouldRender) return;

    const colors = ['#000000', '#DC2626', '#B91C1C', '#7F1D1D', '#991B1B', '#B91C1C', '#DC2626'];

    // Create physics-based particles
    const physicsParticles = createParticlePool({
      poolSize: performance.particleCount,
      maxLife: performance.isMobile ? 8000 : 12000,
      speedRange: performance.isMobile ? [0.2, 0.8] : [0.3, 1.2],
      sizeRange: performance.isMobile ? [1.5, 4.5] : [2, 7],
      opacityRange: [0.2, 0.5]
    });

    // Add visual properties
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

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [performance.particleCount, performance.isMobile, shouldRender]);

  // Optimized animation loop
  const animationCallback = React.useCallback((deltaTime: number) => {
    if (!shouldRender || particlePoolRef.current.length === 0) return;

    const renderTime = measureRenderTime(() => {
      particlePoolRef.current = updateParticles(particlePoolRef.current, deltaTime, {
        width: window.innerWidth,
        height: window.innerHeight
      }) as VisualParticle[];
      setParticles([...particlePoolRef.current]);
    });

    // Log performance metrics
    logPerformanceMetrics({
      fps: Math.round(1000 / deltaTime),
      renderTime,
      particleCount: particlePoolRef.current.length
    });
  }, [shouldRender]);

  const { fps } = useOptimizedAnimation(animationCallback, {
    enabled: performance.animationEnabled && shouldRender,
    maxFrameTime: performance.isMobile ? 33.33 : 16.67 // 30fps mobile, 60fps desktop
  });

  // Don't render if not in viewport or animations disabled
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
        willChange: 'transform'
      }}
    >
      {particles
        .filter(particle => particle.active)
        .map(particle => (
        <motion.div
          key={particle.id}
          className='absolute'
          style={{
            left: particle.x,
            top: particle.y,
            // GPU acceleration hints
            transform: 'translateZ(0)',
            willChange: 'transform',
            // Optimize for mobile
            contain: performance.isMobile ? 'layout style paint' : 'none'
          }}
        >
          {/* Main particle - optimized rendering */}
          <motion.div
            className='rounded-full'
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              // Conditional effects based on performance
              filter: performance.isLowEnd ? 'none' : 'blur(0.5px)',
              boxShadow: performance.isLowEnd
                ? 'none'
                : `0 0 ${particle.size * 1.5}px ${particle.color}20`,
            }}
            animate={performance.reducedMotion ? {} : {
              scale: [1, performance.isMobile ? 1.1 : 1.2, 1],
              opacity: [particle.opacity, particle.opacity * 0.8, particle.opacity],
            }}
            transition={{
              duration: performance.isMobile ? 4 : 2.5 + Math.random(),
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Glow effect - only on capable devices */}
          {!performance.isLowEnd && !performance.reducedMotion && (
            <motion.div
              className='absolute inset-0 rounded-full'
              style={{
                backgroundColor: particle.color,
                filter: `blur(${particle.size * 0.6}px)`,
                opacity: particle.opacity * 0.15,
              }}
              animate={{
                scale: [1.1, 1.4, 1.1],
                opacity: [particle.opacity * 0.15, particle.opacity * 0.05, particle.opacity * 0.15],
              }}
              transition={{
                duration: 3.5 + Math.random() * 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Performance debug info in development */}
      {import.meta.env.DEV && (
        <div className='fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50'>
          FPS: {fps} | Particles: {particles.filter(p => p.active).length}
        </div>
      )}
    </div>
  );
};

export default MartialArtsParticles;
