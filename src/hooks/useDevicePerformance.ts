import { useState, useEffect } from 'react';

interface DevicePerformance {
  isLowEnd: boolean;
  isMobile: boolean;
  reducedMotion: boolean;
  particleCount: number;
  animationEnabled: boolean;
  hardwareAcceleration: boolean;
}

export const useDevicePerformance = (): DevicePerformance => {
  const [performance, setPerformance] = useState<DevicePerformance>({
    isLowEnd: false,
    isMobile: false,
    reducedMotion: false,
    particleCount: 25,
    animationEnabled: true,
    hardwareAcceleration: true,
  });

  useEffect(() => {
    const detectPerformance = () => {
      // Check if device prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Detect mobile devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       window.innerWidth <= 768;
      
      // Check device capabilities
      const hardwareConcurrency = navigator.hardwareConcurrency || 2;
      const deviceMemory = navigator.deviceMemory || 4; // GB
      const connection = navigator.connection;
      
      // Determine if device is low-end
      let isLowEnd = false;
      let particleCount = 25; // Desktop default
      
      if (isMobile) {
        // Mobile performance tiers
        if (hardwareConcurrency <= 4 || deviceMemory <= 2) {
          isLowEnd = true;
          particleCount = 8; // Very conservative for low-end mobile
        } else if (hardwareConcurrency <= 6 || deviceMemory <= 4) {
          particleCount = 12; // Moderate for mid-range mobile
        } else {
          particleCount = 15; // Higher-end mobile
        }
        
        // Further reduce if slow connection
        if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
          isLowEnd = true;
          particleCount = Math.min(particleCount, 6);
        }
      } else {
        // Desktop performance
        if (hardwareConcurrency <= 2 || deviceMemory <= 4) {
          isLowEnd = true;
          particleCount = 15;
        }
      }
      
      // Override for reduced motion preference
      if (prefersReducedMotion) {
        particleCount = Math.min(particleCount, 5);
      }
      
      setPerformance({
        isLowEnd,
        isMobile,
        reducedMotion: prefersReducedMotion,
        particleCount,
        animationEnabled: !prefersReducedMotion,
        hardwareAcceleration: !isLowEnd,
      });
    };

    detectPerformance();
    
    // Re-detect on window resize (orientation change, etc.)
    const handleResize = () => detectPerformance();
    window.addEventListener('resize', handleResize);
    
    // Listen for reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMediaChange = () => detectPerformance();
    mediaQuery.addEventListener('change', handleMediaChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  return performance;
};