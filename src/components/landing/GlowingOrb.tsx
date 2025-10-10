import React from 'react';
import { motion } from 'framer-motion';

interface GlowingOrbProps {
  className?: string;
  color: string;
}

/**
 * GlowingOrb Component
 * Single Responsibility: Renders animated glowing orb effects
 * Follows SRP by focusing only on glow animation and rendering
 */
const GlowingOrb: React.FC<GlowingOrbProps> = ({
  className = "",
  color
}) => (
  <motion.div
    className={`absolute rounded-full blur-xl ${className}`}
    style={{ backgroundColor: color }}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.3, 0.6, 0.3],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

export default GlowingOrb;