import { z } from 'zod';

// =====================================
// AUTHENTICATION SCHEMAS
// =====================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'instructor', 'student']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.role, {
  message: "Please select a role",
  path: ["role"],
});

// =====================================
// STUDENT SCHEMAS
// =====================================

export const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  belt: z.string().min(1, 'Please select a belt level'),
  discipline: z.enum(['Jiujitsu', 'MMA', 'Karate', 'Taekwondo', 'Boxing', 'Kenpo Karate']),
  joinDate: z.string().min(1, 'Join date is required'),
  dateOfBirth: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

// =====================================
// CLASS SCHEMAS
// =====================================

export const classSchema = z.object({
  name: z.string().min(2, 'Class name must be at least 2 characters'),
  discipline: z.enum(['Jiujitsu', 'MMA', 'Karate', 'Taekwondo', 'Boxing', 'Kenpo Karate']),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  instructor: z.string().min(1, 'Instructor is required'),
  maxStudents: z.number().min(1, 'Capacity must be at least 1').max(50, 'Capacity cannot exceed 50'),
  description: z.string().optional(),
});

// =====================================
// PAYMENT SCHEMAS
// =====================================

export const paymentSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  type: z.enum(['monthly', 'drop-in', 'private', 'equipment', 'other']),
  notes: z.string().optional(),
  date: z.string().min(1, 'Payment date is required'),
  status: z.enum(['completed', 'pending', 'failed', 'refunded']).default('completed'),
});

// =====================================
// ATTENDANCE SCHEMAS
// =====================================

export const attendanceSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  classId: z.string().min(1, 'Please select a class'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().optional(),
});

// =====================================
// TYPE EXPORTS
// =====================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type StudentFormData = z.infer<typeof studentSchema>;
export type ClassFormData = z.infer<typeof classSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type AttendanceFormData = z.infer<typeof attendanceSchema>;