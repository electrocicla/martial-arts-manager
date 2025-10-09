import { useAuth as useAuthContext } from '../context/AuthContext';

/**
 * Enhanced authentication hook with additional utilities
 * Extends the base AuthContext with convenience methods and computed values
 */
export function useAuth() {
  const auth = useAuthContext();

  // Computed values
  const isAdmin = auth.user?.role === 'admin';
  const isInstructor = auth.user?.role === 'instructor' || auth.user?.role === 'admin';
  const isStudent = auth.user?.role === 'student';

  // Permission checks
  const hasPermission = (requiredRole: 'admin' | 'instructor' | 'student') => {
    if (!auth.user) return false;
    if (auth.user.role === 'admin') return true;
    return auth.user.role === requiredRole;
  };

  const canManageStudents = isAdmin || isInstructor;
  const canManageClasses = isAdmin || isInstructor;
  const canManagePayments = isAdmin;
  const canViewReports = isAdmin || isInstructor;

  return {
    ...auth,
    // Computed role properties
    isAdmin,
    isInstructor,
    isStudent,
    // Permission helpers
    hasPermission,
    canManageStudents,
    canManageClasses,
    canManagePayments,
    canViewReports,
  };
}