import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function PaymentManager() {
  const { payments, setPayments, students } = useApp();
  const [form, setForm] = useState({ studentId: '', amount: 0, date: '', type: '', notes: '' });

  useEffect(() => {
    fetch('/api/payments')
      .then(r => r.json())
      .then(data => setPayments(data))
      .catch(console.error);
  }, [setPayments]);

  const addPayment = async () => {
    if (form.studentId && form.amount && form.date && form.type) {
      const newPayment = {
        id: Date.now().toString(),
        studentId: form.studentId,
        amount: form.amount,
        date: form.date,
        type: form.type,
        notes: form.notes,
      };
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPayment),
        });
        if (response.ok) {
          setPayments([...payments, newPayment]);
          setForm({ studentId: '', amount: 0, date: '', type: '', notes: '' });
        } else {
          console.error('Failed to add payment');
        }
      } catch (error) {
        console.error('Error adding payment:', error);
      }
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Payment Manager</h2>
      <div className="space-y-2 mb-4">
        <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="w-full border p-2 rounded">
          <option value="">Select Student</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full border p-2 rounded" />
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border p-2 rounded" />
        <input type="text" placeholder="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border p-2 rounded" />
        <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border p-2 rounded" />
        <button onClick={addPayment} className="w-full bg-blue-500 text-white p-2 rounded">Add Payment</button>
      </div>
      <ul className="space-y-2">
        {payments.map(p => (
          <li key={p.id} className="border p-2 rounded bg-white">
            <div className="font-semibold">${p.amount} - {p.type}</div>
            <div className="text-sm text-gray-600">Student: {students.find(s => s.id === p.studentId)?.name} on {p.date} {p.notes}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}