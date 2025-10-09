import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, Filter, Calendar, Clock, MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './ui/Modal';
import { classSchema, type ClassFormData } from '../lib/validation';
import type { Discipline } from '../types';

const disciplines: Discipline[] = ['Jiujitsu', 'MMA', 'Karate', 'Taekwondo', 'Boxing', 'Kenpo Karate'];

const disciplineOptions = disciplines.map(d => ({ value: d, label: d }));

export default function ClassManager() {
  const { classes, setClasses } = useApp();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState<Discipline | ''>('');
  const [filterInstructor, setFilterInstructor] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      maxStudents: 20,
    },
  });

  // Filter and search classes
  const filteredClasses = useMemo(() => {
    return classes.filter(classItem => {
      const matchesSearch = classItem.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          classItem.instructor.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          classItem.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesDiscipline = !filterDiscipline || classItem.discipline === filterDiscipline;
      const matchesInstructor = !filterInstructor || classItem.instructor.toLowerCase().includes(filterInstructor.toLowerCase());

      return matchesSearch && matchesDiscipline && matchesInstructor;
    });
  }, [classes, debouncedSearchTerm, filterDiscipline, filterInstructor]);

  // Get unique instructors for filter
  const instructors = useMemo(() => {
    const uniqueInstructors = [...new Set(classes.map(c => c.instructor))];
    return uniqueInstructors.map(instructor => ({ value: instructor, label: instructor }));
  }, [classes]);

  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.json())
      .then(data => setClasses(data))
      .catch(error => {
        console.error('Failed to fetch classes:', error);
        toast.error('Failed to load classes');
      });
  }, [setClasses, toast]);

  const onSubmit = async (data: ClassFormData) => {
    try {
      const newClass = {
        id: Date.now().toString(),
        ...data,
        isRecurring: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass),
      });

      if (response.ok) {
        setClasses([...classes, newClass]);
        reset();
        setIsModalOpen(false);
        toast.success('Class added successfully');
      } else {
        throw new Error('Failed to add class');
      }
    } catch (error) {
      console.error('Error adding class:', error);
      toast.error('Failed to add class');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classes</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your martial arts classes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Class
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              placeholder="Filter by discipline"
              value={filterDiscipline}
              onChange={(e) => setFilterDiscipline(e.target.value as Discipline)}
              options={disciplineOptions}
            />
            <Select
              placeholder="Filter by instructor"
              value={filterInstructor}
              onChange={(e) => setFilterInstructor(e.target.value)}
              options={instructors}
            />
          </div>
          {(searchTerm || filterDiscipline || filterInstructor) && (
            <div className="flex items-center gap-2 mt-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredClasses.length} of {classes.length} classes
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterDiscipline('');
                  setFilterInstructor('');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map(classItem => (
          <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                    {classItem.name}
                  </h3>
                  <Badge variant="secondary" className="mb-2">
                    {classItem.discipline}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(classItem.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{classItem.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{classItem.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  <span>{classItem.instructor}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Capacity: {classItem.maxStudents}
                  </span>
                  <Link to={`/attendance/${classItem.id}`}>
                    <Button variant="outline" size="sm">
                      Mark Attendance
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {classes.length === 0 ? 'No classes yet. Add your first class!' : 'No classes match your filters.'}
          </p>
        </div>
      )}

      {/* Add Class Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          <h2 className="text-xl font-semibold">Add New Class</h2>
        </ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                {...register('name')}
                label="Class Name"
                placeholder="Enter class name"
                error={errors.name?.message}
              />

              <Select
                {...register('discipline')}
                label="Discipline"
                placeholder="Select discipline"
                options={disciplineOptions}
                error={errors.discipline?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('date')}
                  type="date"
                  label="Date"
                  error={errors.date?.message}
                />

                <Input
                  {...register('time')}
                  type="time"
                  label="Time"
                  error={errors.time?.message}
                />
              </div>

              <Input
                {...register('location')}
                label="Location"
                placeholder="Enter location"
                error={errors.location?.message}
              />

              <Input
                {...register('instructor')}
                label="Instructor"
                placeholder="Enter instructor name"
                error={errors.instructor?.message}
              />

              <Input
                {...register('maxStudents')}
                type="number"
                label="Max Students"
                placeholder="20"
                error={errors.maxStudents?.message}
              />

              <Input
                {...register('description')}
                label="Description (Optional)"
                placeholder="Additional notes"
                error={errors.description?.message}
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
              Add Class
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}