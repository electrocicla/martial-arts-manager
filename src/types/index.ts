/**
 * Core Type Definitions
 */

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Disciplines
export type Discipline = 'Brazilian Jiu-Jitsu' | 'Kickboxing' | 'Muay Thai' | 'MMA' | 'Karate' | 'Jiujitsu' | 'Taekwondo' | 'Boxing' | 'Kenpo Karate' | 'Weightlifting' | 'Brazilian Jiu-Jitsu Kids';

// User Roles
export type UserRole = 'admin' | 'instructor' | 'student';

// Payment Status
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';

// =====================================
// ENTITIES
// =====================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  student_id?: string;
  avatar_url?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  belt: string;
  discipline: string;
  disciplines?: { discipline: string; belt: string }[]; // New array format
  join_date: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  avatar_url?: string;
  notes?: string;
  is_active: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ClassEntity {
  id: string;
  name: string;
  discipline: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  max_students: number;
  enrolled_count?: number;
  description?: string;
  is_recurring: number;
  recurrence_pattern?: string; // JSON string
  is_active: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Alias for backward compatibility
export type Class = ClassEntity;

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  days?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endDate?: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  type: string;
  notes?: string;
  status: string;
  payment_method?: string;
  receipt_url?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  attended: number;
  check_in_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: string; // JSON
  ipAddress?: string;
  timestamp: string;
}

// =====================================
// API TYPES
// =====================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// =====================================
// FORM TYPES
// =====================================

export interface StudentFormData {
  name: string;
  email: string;
  phone?: string;
  discipline: Discipline | '';
  belt: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface ClassFormData {
  name: string;
  discipline: Discipline | '';
  date: string;
  time: string;
  location: string;
  instructor: string;
  maxStudents: number;
  description?: string;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  applyTo?: 'single' | 'all';
}

export interface PaymentFormData {
  studentId: string;
  amount: number;
  date: string;
  type: string;
  status?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface AttendanceFormData {
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

// =====================================
// UI TYPES
// =====================================

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// =====================================
// ANALYTICS TYPES
// =====================================

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalClasses: number;
  upcomingClasses: number;
  monthlyRevenue: number;
  averageAttendance: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface DisciplineDistribution {
  discipline: Discipline;
  count: number;
}
