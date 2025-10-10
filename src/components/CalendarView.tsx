import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useApp } from '../context/AppContext';

export default function CalendarView() {
  const { classes, setClasses } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        if (response.ok) {
          const data = await response.json();
          setClasses(data);
        }
      } catch (error) {
        console.error('Failed to load classes:', error);
      }
    };

    loadClasses();
  }, [setClasses]);

  const classesOnDate = selectedDate ? classes.filter(c => c.date === selectedDate.toISOString().split('T')[0]) : [];

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Class Calendar</h2>
      <Calendar onChange={(value) => setSelectedDate(value as Date)} value={selectedDate} selectRange={false} className="mb-4 w-full" />
      {selectedDate && (
        <div>
          <h3 className="text-lg font-bold">Classes on {selectedDate.toDateString()}</h3>
          <ul className="space-y-2">
            {classesOnDate.map(c => (
              <li key={c.id} className="border p-2 rounded bg-white">
                <div className="font-semibold">{c.name} - {c.discipline}</div>
                <div className="text-sm text-gray-600">{c.time} at {c.location} by {c.instructor}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}