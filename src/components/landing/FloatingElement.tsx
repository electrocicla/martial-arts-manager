import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  children: React.ReactNode;
  delay?: number;
}

/**
 * FloatingElement Component
 * Single Responsibility: Provides floating animation effect for child elements
 * Follows SRP by focusing only on animation behavior
 */
const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  delay = 0
}) => (
  <motion.div
    animate={{
      y: [-10, 10, -10],
      rotate: [-2, 2, -2],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  >
    {children}
  </motion.div>
);

export default FloatingElement;