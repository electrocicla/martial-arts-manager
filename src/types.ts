export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  belt: string;
  discipline: string;
  joinDate: string;
  is_active?: number;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  type: string;
  notes?: string;
}

export interface Class {
  id: string;
  name: string;
  discipline: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  maxStudents: number;
  // Optional additional details
  description?: string;
  is_active?: number;
  recurrence_pattern?: string | null;
}

export interface Attendance {
  id: string;
  classId: string;
  studentId: string;
  attended: boolean;
}

export type Discipline = 'Jiujitsu' | 'MMA' | 'Karate' | 'Taekwondo' | 'Boxing' | 'Kenpo Karate';