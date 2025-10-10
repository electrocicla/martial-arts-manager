import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDevicePerformance } from '../../hooks/useDevicePerformance';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

/**
 * MartialArtsParticles Component
 * Single Responsibility: Renders animated background particles for visual enhancement
 * Follows SRP by focusing only on particle animation and rendering
 */
const MartialArtsParticles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const performance = useDevicePerformance();

  useEffect(() => {
    const createParticles = () => {
      const newParticles: Particle[] = [];
      const colors = ['#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#10b981', '#f97316', '#ec4899'];

      for (let i = 0; i < performance.particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * (performance.isMobile ? 3 : 5) + (performance.isMobile ? 1.5 : 2),
          speed: Math.random() * (performance.isMobile ? 0.8 : 1.2) + 0.2,
          opacity: Math.random() * 0.3 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      setParticles(newParticles);
    };

    createParticles();

    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(createParticles, 250); // Debounce resize
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [performance.particleCount, performance.isMobile]);

  useEffect(() => {
    if (!performance.animationEnabled) return;

    const frameRate = performance.isMobile ? 60 : 40; // Optimize frame rate for mobile

    let animationId: number;
    let lastTime = 0;

    const animateParticles = (currentTime: number) => {
      if (currentTime - lastTime >= frameRate) {
        setParticles(prev => prev.map(particle => ({
          ...particle,
          y: particle.y <= -20 ? window.innerHeight + 20 : particle.y - particle.speed,
          x: particle.x + Math.sin(particle.y * 0.008) * (performance.isMobile ? 0.8 : 1.2),
        })));
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(animateParticles);
    };

    animationId = requestAnimationFrame(animateParticles);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [performance.animationEnabled, performance.isMobile]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x,
            top: particle.y,
            transform: performance.hardwareAcceleration ? 'translateZ(0)' : 'none',
            willChange: performance.hardwareAcceleration ? 'transform' : 'auto',
          }}
        >
          {/* Main particle - simplified for low-end devices */}
          <motion.div
            className="rounded-full relative"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              filter: performance.isMobile || performance.isLowEnd ? 'none' : 'blur(0.5px)',
              boxShadow: performance.isMobile || performance.isLowEnd
                ? 'none'
                : `0 0 ${particle.size * 1.5}px ${particle.color}`,
            }}
            animate={performance.reducedMotion ? {} : {
              scale: [1, performance.isMobile ? 1.2 : 1.4, 1],
              opacity: [particle.opacity, particle.opacity * 0.7, particle.opacity],
            }}
            transition={{
              duration: performance.isMobile ? 3 : 2 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Glow effect - disabled on mobile/low-end for performance */}
          {!performance.isMobile && !performance.isLowEnd && !performance.reducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: particle.color,
                filter: `blur(${particle.size * 0.8}px)`,
                opacity: particle.opacity * 0.2,
              }}
              animate={{
                scale: [1.2, 1.8, 1.2],
                opacity: [particle.opacity * 0.2, particle.opacity * 0.05, particle.opacity * 0.2],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default MartialArtsParticles;