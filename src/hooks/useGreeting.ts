import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for managing greeting based on current time
 */
export const useGreeting = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = hour < 12
    ? t('dashboard.greeting.morning')
    : hour < 17
    ? t('dashboard.greeting.afternoon')
    : t('dashboard.greeting.evening');

  return { greeting, currentTime };
};