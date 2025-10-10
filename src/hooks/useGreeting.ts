import { useState, useEffect } from 'react';
import { getGreeting } from '../lib/dashboardUtils';

/**
 * Custom hook for managing greeting based on current time
 */
export const useGreeting = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = getGreeting(currentTime);

  return { greeting, currentTime };
};