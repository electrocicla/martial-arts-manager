/**
 * Performance Monitoring Utilities
 * Tracks and reports performance metrics for optimization validation
 */

export interface PerformanceMetrics {
  fps: number;
  memoryUsage?: number;
  renderTime: number;
  particleCount: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;
  private startTime = performance.now();

  recordMetric(metric: Omit<PerformanceMetrics, 'timestamp'>) {
    const newMetric: PerformanceMetrics = {
      ...metric,
      timestamp: performance.now() - this.startTime
    };

    this.metrics.push(newMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getAverageFPS(): number {
    if (this.metrics.length === 0) return 60;

    const recentMetrics = this.metrics.slice(-10); // Last 10 measurements
    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;

    return Math.round(avgFPS);
  }

  getAverageRenderTime(): number {
    if (this.metrics.length === 0) return 16.67;

    const recentMetrics = this.metrics.slice(-10);
    const avgRenderTime = recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length;

    return Math.round(avgRenderTime * 100) / 100;
  }

  getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return undefined;
  }

  getMetricsSummary() {
    return {
      averageFPS: this.getAverageFPS(),
      averageRenderTime: this.getAverageRenderTime(),
      memoryUsage: this.getMemoryUsage(),
      totalMeasurements: this.metrics.length,
      particleCount: this.metrics[this.metrics.length - 1]?.particleCount || 0
    };
  }

  clear() {
    this.metrics = [];
    this.startTime = performance.now();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common performance measurements
export const measureRenderTime = (callback: () => void): number => {
  const start = performance.now();
  callback();
  return performance.now() - start;
};

export const logPerformanceMetrics = (metrics: Omit<PerformanceMetrics, 'timestamp'>) => {
  performanceMonitor.recordMetric(metrics);

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('Performance Metrics:', {
      ...metrics,
      memoryUsage: performanceMonitor.getMemoryUsage()
    });
  }
};