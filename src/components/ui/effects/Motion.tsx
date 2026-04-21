/**
 * Motion primitives for the v2 design system.
 * - FadeUp: enter animation (used inside Stagger).
 * - Stagger: container that staggers children with reduced-motion safety.
 * - PressableMotion: scale-on-press wrapper for tactile buttons / cards.
 *
 * All wrappers respect prefers-reduced-motion.
 */
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../../../lib/useBreakpoint';

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.16, 1, 0.3, 1] } },
};

const staggerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export interface FadeUpProps extends Omit<HTMLMotionProps<'div'>, 'variants' | 'initial' | 'animate'> {
  children: ReactNode;
  delay?: number;
}

export const FadeUp = forwardRef<HTMLDivElement, FadeUpProps>(function FadeUp(
  { children, delay = 0, ...rest },
  ref
) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div ref={ref} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  return (
    <motion.div
      ref={ref}
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

export interface StaggerProps extends Omit<HTMLMotionProps<'div'>, 'variants' | 'initial' | 'animate'> {
  children: ReactNode;
  /** When true, animate when entering viewport (whileInView). Default false. */
  whenInView?: boolean;
}

export const Stagger = forwardRef<HTMLDivElement, StaggerProps>(function Stagger(
  { children, whenInView = false, ...rest },
  ref
) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div ref={ref} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  if (whenInView) {
    return (
      <motion.div
        ref={ref}
        variants={staggerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div ref={ref} variants={staggerVariants} initial="hidden" animate="visible" {...rest}>
      {children}
    </motion.div>
  );
});

export interface PressableProps extends Omit<HTMLMotionProps<'button'>, 'whileTap' | 'whileHover'> {
  children: ReactNode;
  /** Hover lift in px. Default 0 (no lift, only press scale). */
  lift?: number;
}

export const PressableMotion = forwardRef<HTMLButtonElement, PressableProps>(function PressableMotion(
  { children, lift = 0, ...rest },
  ref
) {
  const reduced = usePrefersReducedMotion();
  if (reduced) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- HTMLMotionProps overlap with intrinsic props is intentional pass-through
    return <button ref={ref} {...(rest as any)}>{children}</button>;
  }
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      whileHover={lift ? { y: -lift } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.5 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
