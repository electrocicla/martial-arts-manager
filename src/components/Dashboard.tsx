import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { students, classes, payments } = useApp();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalPayments: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Calculate stats
    const totalStudents = students.length;
    const totalClasses = classes.length;
    const totalPayments = payments.length;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    setStats({ totalStudents, totalClasses, totalPayments, totalRevenue });
  }, [students, classes, payments]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold">Students</h3>
          <p className="text-2xl">{stats.totalStudents}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-semibold">Classes</h3>
          <p className="text-2xl">{stats.totalClasses}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-semibold">Payments</h3>
          <p className="text-2xl">{stats.totalPayments}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <h3 className="font-semibold">Revenue</h3>
          <p className="text-2xl">${stats.totalRevenue}</p>
        </div>
      </div>
    </div>
  );
}