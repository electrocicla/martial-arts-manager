/**
 * Core Type Definitions
 */

// Disciplines
export type Discipline = 'Jiujitsu' | 'MMA' | 'Karate' | 'Taekwondo' | 'Boxing' | 'Kenpo Karate';

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
  studentId?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  discipline: Discipline;
  joinDate: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  avatarUrl?: string;
  notes?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Class {
  id: string;
  name: string;
  discipline: Discipline;
  date: string;
  time: string;
  location: string;
  instructor: string;
  maxStudents: number;
  description?: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  days?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endDate?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  type: string;
  notes?: string;
  status: PaymentStatus;
  paymentMethod?: string;
  receiptUrl?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Attendance {
  id: string;
  classId: string;
  studentId: string;
  attended: boolean;
  checkInTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
}

export interface PaymentFormData {
  studentId: string;
  amount: number;
  date: string;
  type: string;
  paymentMethod?: string;
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
