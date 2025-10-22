import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useClasses } from '../hooks/useClasses';
import type { Class } from '../types';
import ClassDetailsModal from './classes/ClassDetailsModal';
import { useTranslation } from 'react-i18next';

export default function CalendarView() {
  const { t } = useTranslation();
  const { classes } = useClasses();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const classesOnDate = selectedDate ? classes.filter((c: Class) => c.date === selectedDate.toISOString().split('T')[0]) : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-50">{t('nav.calendar')}</h2>
      
      {/* Calendar Container with Dark Theme */}
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-6 border border-gray-700">
        <Calendar 
          onChange={(value) => setSelectedDate(value as Date)} 
          value={selectedDate} 
          selectRange={false} 
          className="custom-calendar w-full"
        />
      </div>

      {/* Selected Date Classes */}
      {selectedDate && (
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 animate-slide-up">
          <h3 className="text-xl font-bold mb-4 text-gray-50">
            Classes on {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          {classesOnDate.length > 0 ? (
            <ul className="space-y-3">
              {classesOnDate.map((c: Class) => (
                <li 
                  key={c.id} 
                  className="border border-gray-700 p-4 rounded-lg bg-gray-900 hover:bg-gray-750 hover:border-red-600 transition-all duration-200 cursor-pointer"
                  onClick={() => { setSelectedClass(c); setShowDetails(true); }}
                >
                  <div className="font-semibold text-lg text-gray-100">
                    {c.name} - <span className="text-red-500">{c.discipline}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    🕐 {c.time} • 📍 {c.location} • 👤 {c.instructor}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-4">No classes scheduled for this day</p>
          )}
        </div>
      )}

      {selectedClass && (
        <ClassDetailsModal isOpen={showDetails} onClose={() => { setShowDetails(false); setSelectedClass(null); }} cls={selectedClass} />
      )}
    </div>
  );
}