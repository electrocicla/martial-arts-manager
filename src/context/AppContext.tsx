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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  return (
    <AppContext.Provider value={{ students, setStudents, classes, setClasses, payments, setPayments }}>
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