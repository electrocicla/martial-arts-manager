/**
 * Services Index
 * Central export point for all service classes
 * Follows the Repository pattern for data access abstraction
 */

export { studentService, type StudentService } from './student.service';
export { classService, type ClassService } from './class.service';
export { paymentService, type PaymentService } from './payment.service';
export { attendanceService, type AttendanceService } from './attendance.service';

// Re-export types for convenience
export type {
  StudentFilters,
  StudentStats,
} from './student.service';

export type {
  ClassFilters,
  ClassStats,
} from './class.service';

export type {
  PaymentFilters,
  PaymentStats,
} from './payment.service';

export type {
  AttendanceRecord,
  AttendanceStats,
  AttendanceFilters,
} from './attendance.service';