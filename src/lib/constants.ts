import type { Discipline } from '../types';

/**
 * Application Constants
 */

// Martial Arts Disciplines
export const DISCIPLINES: Discipline[] = [
  'Brazilian Jiu-Jitsu',
  'Karate',
  'Taekwondo',
  'Kickboxing',
  'Muay Thai',
  'MMA',
  'Jiujitsu',
  'Boxing',
  'Kenpo Karate',
];

// Belt Rankings by Discipline
export const BELT_RANKINGS: Record<Discipline, string[]> = {
  'Brazilian Jiu-Jitsu': ['White', 'Blue', 'Purple', 'Brown', 'Black', 'Red/White', 'Red', 'Black/Red'],
  Karate: ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'],
  Taekwondo: ['White', 'Yellow', 'Green', 'Blue', 'Red', 'Black'],
  Kickboxing: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  'Muay Thai': ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  MMA: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  Jiujitsu: ['White', 'Blue', 'Purple', 'Brown', 'Black', 'Red/White', 'Red', 'Black/Red'],
  Boxing: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
  'Kenpo Karate': ['White', 'Yellow', 'Orange', 'Purple', 'Blue', 'Green', 'Brown', 'Black'],
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const;

// Payment Types
export const PAYMENT_TYPES = [
  'Monthly Membership',
  'Drop-in Class',
  'Private Lesson',
  'Equipment',
  'Belt Test',
  'Other',
] as const;

// Payment Status
export const PAYMENT_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_ME: '/api/auth/me',

  // Students
  STUDENTS: '/api/students',
  STUDENT: (id: string) => `/api/students/${id}`,

  // Classes
  CLASSES: '/api/classes',
  CLASS: (id: string) => `/api/classes/${id}`,

  // Payments
  PAYMENTS: '/api/payments',
  PAYMENT: (id: string) => `/api/payments/${id}`,

  // Attendance
  ATTENDANCE: '/api/attendance',
  ATTENDANCE_BY_CLASS: (classId: string) => `/api/attendance?classId=${classId}`,
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

// Toast Duration
export const TOAST_DURATION = 3000; // milliseconds

// Debounce Delay for Search
export const SEARCH_DEBOUNCE_DELAY = 300; // milliseconds

// Mobile Breakpoint (matches Tailwind's 'md' breakpoint)
export const MOBILE_BREAKPOINT = 768; // pixels
