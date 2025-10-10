/**
 * Get the appropriate greeting based on current time
 */
export const getGreeting = (currentTime: Date): string => {
  const hour = currentTime.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Determine class status based on date and time
 */
export const getClassStatus = (date: string, time: string) => {
  const now = new Date();
  const classTime = new Date(`${date}T${time}`);
  return classTime > now ? 'upcoming' : 'ongoing';
};

/**
 * Generate recent activity items from payments and classes
 */
export const generateRecentActivity = (recentPayments: any[], todayClasses: any[]) => {
  return [
    ...(recentPayments.slice(0, 2).map(payment => ({
      icon: '💰',
      text: `Payment received: $${payment.amount}`,
      time: new Date(payment.date).toLocaleDateString(),
      type: 'info' as const
    }))),
    ...todayClasses.slice(0, 2).map(cls => ({
      icon: '🥋',
      text: `Class scheduled: ${cls.name}`,
      time: new Date(`${cls.date}T${cls.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'warning' as const
    }))
  ];
};