import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Discipline } from '../types';

const disciplines: Discipline[] = ['Jiujitsu', 'MMA', 'Karate', 'Taekwondo', 'Boxing', 'Kenpo Karate'];

export default function ClassManager() {
  const { classes, setClasses } = useApp();
  const [form, setForm] = useState({ name: '', discipline: '' as Discipline | '', date: '', time: '', location: '', instructor: '', maxStudents: 20 });

  const addClass = () => {
    if (form.name && form.discipline && form.date && form.time && form.location && form.instructor) {
      const newClass = {
        id: Date.now().toString(),
        name: form.name,
        discipline: form.discipline,
        date: form.date,
        time: form.time,
        location: form.location,
        instructor: form.instructor,
        maxStudents: form.maxStudents,
      };
      setClasses([...classes, newClass]);
      setForm({ name: '', discipline: '', date: '', time: '', location: '', instructor: '', maxStudents: 20 });
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Class Manager</h2>
      <div className="space-y-2 mb-4">
        <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border p-2 rounded" />
        <select value={form.discipline} onChange={e => setForm({ ...form, discipline: e.target.value as Discipline })} className="w-full border p-2 rounded">
          <option value="">Select Discipline</option>
          {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border p-2 rounded" />
        <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full border p-2 rounded" />
        <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full border p-2 rounded" />
        <input type="text" placeholder="Instructor" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} className="w-full border p-2 rounded" />
        <input type="number" placeholder="Max Students" value={form.maxStudents} onChange={e => setForm({ ...form, maxStudents: Number(e.target.value) })} className="w-full border p-2 rounded" />
        <button onClick={addClass} className="w-full bg-blue-500 text-white p-2 rounded">Add Class</button>
      </div>
      <ul className="space-y-2">
        {classes.map(c => (
          <li key={c.id} className="border p-2 rounded bg-white">
            <div className="font-semibold">{c.name} - {c.discipline}</div>
            <div className="text-sm text-gray-600">{c.date} {c.time} at {c.location} by {c.instructor}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}