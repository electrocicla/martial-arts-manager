import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Student, Class, Payment } from '../types';

interface AppContextType {
  students: Student[];
  setStudents: (students: Student[]) => void;
  classes: Class[];
  setClasses: (classes: Class[]) => void;
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  // Helpers to add single items
  addStudent: (student: Student) => Promise<void>;
  addClass: (cls: Class) => Promise<void>;
  addPayment: (payment: Payment) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Define single-item addition helpers
  const addStudent = async (student: Student) => {
    setStudents(prev => [...prev, student]);
  };
  const addClass = async (cls: Class) => {
    setClasses(prev => [...prev, cls]);
  };
  const addPayment = async (payment: Payment) => {
    setPayments(prev => [...prev, payment]);
  };
  return (
    <AppContext.Provider value={{ 
      students, setStudents, addStudent,
      classes, setClasses, addClass,
      payments, setPayments, addPayment
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};