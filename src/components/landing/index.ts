/**
 * Landing Page Components
 * Modular components for the landing page following SOLID principles
 *
 * NOTE: MartialArtsParticles is intentionally NOT re-exported here because
 * LandingPage.tsx imports it dynamically via React.lazy() for code-splitting.
 * Static re-export would defeat the split.
 */

export { default as FloatingElement } from './FloatingElement';
export { default as GlowingOrb } from './GlowingOrb';