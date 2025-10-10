import { useEffect, useRef, useState } from 'react';

/**
 * Intersection Observer Hook
 * Provides efficient viewport detection for lazy loading and performance optimization
 */

export interface IntersectionOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  triggerOnce?: boolean;
}

export const useIntersectionObserver = (
  options: IntersectionOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    root = null,
    triggerOnce = true
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<Element | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && triggerOnce && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        rootMargin,
        root
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, root, triggerOnce, hasIntersected]);

  const shouldRender = triggerOnce ? hasIntersected : isIntersecting;

  return {
    ref: elementRef,
    isIntersecting,
    hasIntersected,
    shouldRender
  };
};