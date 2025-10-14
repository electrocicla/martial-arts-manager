import { AttendanceRow } from './AttendanceRow';
import type { Student } from '../../types/index';

interface AttendanceListProps {
  students: Student[];
  attendance: Record<string, boolean>;
  onToggleAttendance: (studentId: string) => void;
}

/**
 * AttendanceList Component
 * Responsibility: Render list of students with attendance checkboxes
 * SRP: Only handles list rendering, delegates row rendering to AttendanceRow
 */
export function AttendanceList({ students, attendance, onToggleAttendance }: AttendanceListProps) {
  return (
    <div className="space-y-3">
      {students.map((student) => (
        <AttendanceRow
          key={student.id}
          student={student}
          isPresent={attendance[student.id] || false}
          onToggle={() => onToggleAttendance(student.id)}
        />
      ))}
    </div>
  );
}
