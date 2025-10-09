import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function AttendanceManager() {
  const { classId } = useParams<{ classId: string }>();
  const { students } = useApp();
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (classId) {
      fetch(`/api/attendance?classId=${classId}`)
        .then(r => r.json())
        .then(data => {
          const att = data.reduce((acc: Record<string, boolean>, item: { student_id: string; attended: number }) => {
            acc[item.student_id] = item.attended === 1;
            return acc;
          }, {});
          setAttendance(att);
        })
        .catch(console.error);
    }
  }, [classId]);

  const toggleAttendance = async (studentId: string) => {
    const newAttended = !attendance[studentId];
    setAttendance({ ...attendance, [studentId]: newAttended });
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, studentId, attended: newAttended }),
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      // Revert on error
      setAttendance({ ...attendance, [studentId]: !newAttended });
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
      <ul className="space-y-2">
        {students.map(s => (
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