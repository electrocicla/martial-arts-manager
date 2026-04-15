/**
 * Student Utilities
 * Utility functions for student-related operations
 * Follows SRP by providing focused utility functions
 */

/**
 * Get belt color class for UI display
 * @param belt - The belt rank name
 * @returns Tailwind CSS class for belt color
 */
export const getBeltColor = (belt: string): string => {
  const colors: Record<string, string> = {
    'White': 'badge-ghost',
    'Yellow': 'badge-warning',
    'Orange': 'badge-secondary',
    'Green': 'badge-success',
    'Blue': 'badge-info',
    'Purple': 'badge-primary',
    'Brown': 'badge-neutral',
    'Black': 'badge-neutral',
    'Red/White': 'badge-error',
    'Red': 'badge-error',
    'Black/Red': 'badge-neutral',
    'Beginner': 'badge-ghost',
    'Intermediate': 'badge-info',
    'Advanced': 'badge-warning',
    'Expert': 'badge-success',
    'Professional': 'badge-primary',
    'Elite': 'badge-accent'
  };
  return colors[belt] || 'badge-ghost';
};

/**
 * Get belt progression order for sorting
 * @param belt - The belt rank name
 * @returns Numeric order for belt progression
 */
export const getBeltOrder = (belt: string): number => {
  const order: Record<string, number> = {
    'White': 1,
    'Yellow': 2,
    'Orange': 3,
    'Green': 4,
    'Blue': 5,
    'Brown': 6,
    'Black': 7
  };
  return order[belt] || 0;
};