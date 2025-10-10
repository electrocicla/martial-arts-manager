import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAttendance } from '../hooks/useAttendance';
import { useStudents } from '../hooks/useStudents';
import type { Student } from '../types/index';

export default function AttendanceManager() {
  const { classId } = useParams<{ classId: string }>();
  const { students } = useStudents();
  const { markPresent, markAbsent } = useAttendance();
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const toggleAttendance = async (studentId: string) => {
    if (!classId) return;

    const newAttended = !attendance[studentId];
    setAttendance({ ...attendance, [studentId]: newAttended });

    const result = newAttended
      ? await markPresent(studentId, classId)
      : await markAbsent(studentId, classId);

    if (!result) {
      // Revert on error
      setAttendance({ ...attendance, [studentId]: !newAttended });
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
      <ul className="space-y-2">
        {students.map((s: Student) => (
          <li key={s.id} className="flex items-center justify-between border p-2 rounded bg-white">
            <span>{s.name}</span>
            <input
              type="checkbox"
              checked={attendance[s.id] || false}
              onChange={() => toggleAttendance(s.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}