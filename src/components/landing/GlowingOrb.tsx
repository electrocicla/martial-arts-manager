import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDevicePerformance } from '../../hooks/useDevicePerformance';

interface GlowingOrbProps {
  className?: string;
  color: string;
}

/**
 * GlowingOrb Component
 * Performance-optimized with conditional animations and reduced motion support
 */
const GlowingOrb: React.FC<GlowingOrbProps> = ({
  className = "",
  color
}) => {
  const performance = useDevicePerformance();

  // Memoize animation config to prevent recreation
  const animationConfig = useMemo(() => {
    if (performance.reducedMotion || performance.isLowEnd) {
      return {
        animate: {},
        transition: {}
      };
    }

    return {
      animate: {
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      },
      transition: {
        duration: performance.isMobile ? 4 : 3,
        repeat: Infinity,
        ease: "easeInOut" as const,
      }
    };
  }, [performance]);

  // Use CSS-based animation for better performance on mobile
  if (performance.isMobile || performance.isLowEnd) {
    return (
      <div
        className={`absolute rounded-full blur-xl ${className} ${
          !performance.reducedMotion ? 'animate-pulse-slow' : ''
        }`}
        style={{
          backgroundColor: color,
          // Force GPU acceleration
          transform: 'translateZ(0)',
          willChange: 'transform',
          contain: 'layout style paint'
        }}
      />
    );
  }

  return (
    <motion.div
      className={`absolute rounded-full blur-xl ${className}`}
      style={{
        backgroundColor: color,
        // Force GPU acceleration
        transform: 'translateZ(0)',
        willChange: 'transform',
        contain: 'layout style paint'
      }}
      {...animationConfig}
    />
  );
};

export default GlowingOrb;