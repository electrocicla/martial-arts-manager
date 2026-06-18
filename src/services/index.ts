/**
 * Services Index
 * Central export point for all service classes
 * Follows the Repository pattern for data access abstraction
 */

export { studentService, type StudentService } from './student.service';
export { classService, type ClassService } from './class.service';
export { paymentService, type PaymentService } from './payment.service';
export { attendanceService, type AttendanceService } from './attendance.service';
export { analyticsService, type AnalyticsService, type AnalyticsData } from './analytics.service';
export { branchService, type BranchService } from './branch.service';
export { notificationService, type NotificationService } from './notification.service';

// Re-export types for convenience
export type {
  StudentFilters,
  StudentStats,
} from './student.service';

export type {
  ClassFilters,
  ClassStats,
  ClassMetadata,
} from './class.service';

export type {
  PaymentFilters,
  PaymentStats,
  PaymentHistoryRow,
  PaymentHistoryMonth,
  PaymentHistoryResponse,
  OverdueStudent,
  OverdueStudentsResponse,
  NotifyOverduePayload,
  NotifyOverdueResponse,
  NotifyOverdueBulkPayload,
  NotifyOverdueBulkResponse,
  NotifyOverdueBulkResultEntry,
} from './payment.service';

export type {
  AttendanceRecord,
  AttendanceStats,
  AttendanceFilters,
} from './attendance.service';
