/**
 * Shared types for Cloudflare Pages Functions
 */

// Cloudflare D1 Database types
export type D1BindValue = string | number | boolean | null | ArrayBuffer | Date;

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: D1BindValue[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    changed_db: boolean;
    changes: number;
    duration: number;
    last_row_id?: number;
    rows_read: number;
    rows_written: number;
    size_after: number;
  };
}

// Environment interface for Cloudflare Pages Functions
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// Student types
export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  belt: string;
  discipline: string;
  join_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Class types
export interface Class {
  id: string;
  name: string;
  instructor: string;
  start_time: string;
  end_time: string;
  discipline: string;
  capacity: number;
  enrolled_count: number;
  created_at: string;
}

// Payment types
export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  description?: string;
  created_at: string;
}

// Attendance types
export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  created_at: string;
}

// Auth types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  student_id?: string;
  avatar_url?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

// API Request/Response types
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