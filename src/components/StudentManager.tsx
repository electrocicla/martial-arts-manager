import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './ui/Modal';
import { studentSchema, type StudentFormData } from '../lib/validation';
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

const disciplineOptions = disciplines.map(d => ({ value: d, label: d }));

export default function StudentManager() {
  const { students, setStudents } = useApp();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState<Discipline | ''>('');
  const [filterBelt, setFilterBelt] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      joinDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedDiscipline = watch('discipline');

  // Filter and search students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesDiscipline = !filterDiscipline || student.discipline === filterDiscipline;
      const matchesBelt = !filterBelt || student.belt === filterBelt;

      return matchesSearch && matchesDiscipline && matchesBelt;
    });
  }, [students, debouncedSearchTerm, filterDiscipline, filterBelt]);

  // Belt options based on selected discipline
  const beltOptions = selectedDiscipline ? belts[selectedDiscipline].map(b => ({ value: b, label: b })) : [];

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => setStudents(data))
      .catch(error => {
        console.error('Failed to fetch students:', error);
        toast.error('Failed to load students');
      });
  }, [setStudents, toast]);

  const onSubmit = async (data: StudentFormData) => {
    try {
      const newStudent = {
        id: Date.now().toString(),
        ...data,
      };

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });

      if (response.ok) {
        setStudents([...students, newStudent]);
        reset();
        setIsModalOpen(false);
        toast.success('Student added successfully');
      } else {
        throw new Error('Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    }
  };

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">Students</h1>
          <p className="text-sm sm:text-base font-medium bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Manage your martial arts students</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          leftIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
          className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold shadow-lg"
        >
          Add Student
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-4 sm:mb-6 backdrop-blur-xl bg-white/10 border-white/20">
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 sm:w-5 sm:h-5" />}
                className="text-sm sm:text-base"
              />
            </div>
            <Select
              placeholder="Filter by discipline"
              value={filterDiscipline}
              onChange={(e) => setFilterDiscipline(e.target.value as Discipline)}
              options={disciplineOptions}
            />
            <Select
              placeholder="Filter by belt"
              value={filterBelt}
              onChange={(e) => setFilterBelt(e.target.value)}
              options={filterDiscipline ? belts[filterDiscipline].map(b => ({ value: b, label: b })) : []}
              disabled={!filterDiscipline}
            />
          </div>
          {(searchTerm || filterDiscipline || filterBelt) && (
            <div className="flex items-center gap-2 mt-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredStudents.length} of {students.length} students
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterDiscipline('');
                  setFilterBelt('');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(student => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {student.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                </div>
                <Badge variant="secondary">{student.belt}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discipline:
                  </span>
                  <Badge variant="secondary">{student.discipline}</Badge>
                </div>
                {student.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {student.phone}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Joined:
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(student.joinDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {students.length === 0 ? 'No students yet. Add your first student!' : 'No students match your filters.'}
          </p>
        </div>
      )}

      {/* Add Student Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          <h2 className="text-xl font-semibold">Add New Student</h2>
        </ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                {...register('name')}
                label="Full Name"
                placeholder="Enter student's full name"
                error={errors.name?.message}
              />

              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="Enter email address"
                error={errors.email?.message}
              />

              <Input
                {...register('phone')}
                type="tel"
                label="Phone Number (Optional)"
                placeholder="Enter phone number"
                error={errors.phone?.message}
              />

              <Select
                {...register('discipline')}
                label="Discipline"
                placeholder="Select discipline"
                options={disciplineOptions}
                error={errors.discipline?.message}
              />

              <Select
                {...register('belt')}
                label="Belt Level"
                placeholder="Select belt level"
                options={beltOptions}
                error={errors.belt?.message}
                disabled={!selectedDiscipline}
              />

              <Input
                {...register('joinDate')}
                type="date"
                label="Join Date"
                error={errors.joinDate?.message}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add Student
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}