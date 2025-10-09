import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Discipline } from '../types';

const disciplines: Discipline[] = ['Jiujitsu', 'MMA', 'Karate', 'Taekwondo', 'Boxing', 'Kenpo Karate'];

const belts: Record<Discipline, string[]> = {
  Jiujitsu: ['White', 'Blue', 'Purple', 'Brown', 'Black'],
  MMA: ['White', 'Blue', 'Purple', 'Brown', 'Black'],
  Karate: ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'],
  Taekwondo: ['White', 'Yellow', 'Green', 'Blue', 'Red', 'Black'],
  Boxing: ['Beginner', 'Intermediate', 'Advanced'],
  'Kenpo Karate': ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'],
};

export default function StudentManager() {
  const { students, setStudents } = useApp();
  const [form, setForm] = useState({ name: '', email: '', phone: '', discipline: '' as Discipline | '', belt: '' });

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => setStudents(data))
      .catch(console.error);
  }, [setStudents]);

  const addStudent = async () => {
    if (form.name && form.email && form.discipline && form.belt) {
      const newStudent = {
        id: Date.now().toString(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        belt: form.belt,
        discipline: form.discipline,
        joinDate: new Date().toISOString().split('T')[0],
      };
      try {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newStudent),
        });
        if (response.ok) {
          setStudents([...students, newStudent]);
          setForm({ name: '', email: '', phone: '', discipline: '', belt: '' });
        } else {
          console.error('Failed to add student');
        }
      } catch (error) {
        console.error('Error adding student:', error);
      }
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Student Manager</h2>
      <div className="space-y-2 mb-4">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          type="tel"
          placeholder="Phone"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <select
          value={form.discipline}
          onChange={e => setForm({ ...form, discipline: e.target.value as Discipline, belt: '' })}
          className="w-full border p-2 rounded"
        >
          <option value="">Select Discipline</option>
          {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={form.belt}
          onChange={e => setForm({ ...form, belt: e.target.value })}
          className="w-full border p-2 rounded"
          disabled={!form.discipline}
        >
          <option value="">Select Belt</option>
          {form.discipline && belts[form.discipline].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <button onClick={addStudent} className="w-full bg-blue-500 text-white p-2 rounded">Add Student</button>
      </div>
      <ul className="space-y-2">
        {students.map(s => (
          <li key={s.id} className="border p-2 rounded bg-white">
            <div className="font-semibold">{s.name}</div>
            <div className="text-sm text-gray-600">{s.email} - {s.discipline} {s.belt}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}