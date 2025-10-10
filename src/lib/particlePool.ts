/**
 * Particle Pool Management
 * Provides efficient particle recycling to reduce memory allocation and GC pressure
 */

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  active: boolean;
}

export interface ParticlePoolConfig {
  poolSize: number;
  maxLife: number;
  speedRange: [number, number];
  sizeRange: [number, number];
  opacityRange: [number, number];
}

/**
 * Creates a particle pool with pre-allocated particles
 */
export const createParticlePool = (config: ParticlePoolConfig): Particle[] => {
  return Array.from({ length: config.poolSize }, (_, i) => ({
    id: i,
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
    vx: (Math.random() - 0.5) * (config.speedRange[1] - config.speedRange[0]) + config.speedRange[0],
    vy: (Math.random() - 0.5) * (config.speedRange[1] - config.speedRange[0]) + config.speedRange[0],
    life: Math.random() * config.maxLife,
    maxLife: config.maxLife,
    size: Math.random() * (config.sizeRange[1] - config.sizeRange[0]) + config.sizeRange[0],
    opacity: Math.random() * (config.opacityRange[1] - config.opacityRange[0]) + config.opacityRange[0],
    active: true
  }));
};

/**
 * Updates particle positions and recycles dead particles
 */
export const updateParticles = (particles: Particle[], deltaTime: number, bounds: { width: number; height: number }): Particle[] => {
  return particles.map(particle => {
    if (!particle.active) return particle;

    // Update position
    particle.x += particle.vx * deltaTime * 0.016; // Normalize for 60fps
    particle.y += particle.vy * deltaTime * 0.016;

    // Update life
    particle.life -= deltaTime * 0.016;

    // Boundary checks and recycling
    if (particle.x < -50) {
      particle.x = bounds.width + 50;
      particle.life = particle.maxLife; // Reset life
    } else if (particle.x > bounds.width + 50) {
      particle.x = -50;
      particle.life = particle.maxLife;
    }

    if (particle.y < -50) {
      particle.y = bounds.height + 50;
      particle.life = particle.maxLife;
    } else if (particle.y > bounds.height + 50) {
      particle.y = -50;
      particle.life = particle.maxLife;
    }

    // Deactivate dead particles
    if (particle.life <= 0) {
      particle.active = false;
    }

    return particle;
  });
};

/**
 * Respawns inactive particles
 */
export const respawnParticles = (particles: Particle[], bounds: { width: number; height: number }): Particle[] => {
  return particles.map(particle => {
    if (!particle.active) {
      particle.x = Math.random() * bounds.width;
      particle.y = Math.random() * bounds.height;
      particle.life = particle.maxLife;
      particle.active = true;
    }
    return particle;
  });
};