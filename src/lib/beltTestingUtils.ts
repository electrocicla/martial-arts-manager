import type { Student, Attendance, Class } from '../types';
import { BELT_RANKINGS } from './constants';

export interface UpcomingTest {
  id: number;
  date: string;
  time: string;
  belt: string;
  candidates: number;
  examiner: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface EligibleStudent {
  id: string;
  name: string;
  discipline: string;
  currentBelt: string;
  targetBelt: string;
  classesAttended: number;
  requiredClasses: number;
  lastPromotion: string;
  readyStatus: 'ready' | 'needs-more-practice';
}

export interface TestHistoryRecord {
  id: string;
  belt: string;
  date: string;
  examiner: string;
  passed: number;
  failed: number;
  total: number;
}

export const BELT_PROGRESSION = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'];

export const BELT_REQUIREMENTS: Record<string, number> = {
  'White': 40,
  'Yellow': 50,
  'Orange': 60,
  'Green': 80,
  'Blue': 100,
  'Purple': 120,
  'Brown': 150,
  'Black': 200
};

export const BELT_COLORS: Record<string, string> = {
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
  'Professional': 'badge-primary'
};

export function getNextBelt(currentBelt: string, discipline: string): string {
  const belts = BELT_RANKINGS[discipline as keyof typeof BELT_RANKINGS] || [];
  const currentIndex = belts.indexOf(currentBelt);
  return currentIndex < belts.length - 1 ? belts[currentIndex + 1] : belts[belts.length - 1];
}

export function getRequiredClasses(belt: string): number {
  return BELT_REQUIREMENTS[belt] || 40;
}

export function calculateUpcomingTests(students: Student[], classes: Class[]): UpcomingTest[] {
  // Get unique instructors and locations from actual classes
  const instructors = [...new Set(classes.map(c => c.instructor))];
  const locations = [...new Set(classes.map(c => c.location))];
  
  // Use default values if no classes exist yet
  const defaultInstructors = instructors.length > 0 ? instructors : ['Sensei Yamamoto'];
  const defaultLocations = locations.length > 0 ? locations : ['Main Dojo'];

  const beltGroups = students.reduce((acc, student) => {
    if (!acc[student.belt]) {
      acc[student.belt] = [];
    }
    acc[student.belt].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  return Object.entries(beltGroups).map(([belt, students], index) => ({
    id: index + 1,
    date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: index % 2 === 0 ? '10:00 AM' : '2:00 PM',
    belt: `${belt} Belt`,
    candidates: students.length,
    examiner: defaultInstructors[index % defaultInstructors.length],
    location: defaultLocations[index % defaultLocations.length],
    status: 'scheduled' as const
  }));
}

export function calculateEligibleStudents(students: Student[], attendance: Attendance[]): EligibleStudent[] {
  return students.map((student: Student) => {
    // Count actual attendance for this student
    const studentAttendance = attendance.filter(a => a.student_id === student.id && a.attended === 1);
    const classesAttended = studentAttendance.length;

    return {
      id: student.id,
      name: student.name,
      discipline: student.discipline,
      currentBelt: student.belt,
      targetBelt: getNextBelt(student.belt, student.discipline),
      classesAttended,
      requiredClasses: getRequiredClasses(student.belt),
      lastPromotion: student.join_date,
      readyStatus: classesAttended >= getRequiredClasses(student.belt) ? 'ready' : 'needs-more-practice'
    };
  });
}

export function getBeltColor(belt: string): string {
  return BELT_COLORS[belt] || 'badge-ghost';
}