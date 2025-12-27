import { useState, useEffect, forwardRef } from 'react';
import { Select } from './Select';
import type { SelectProps } from './Select';
import { useTranslation } from 'react-i18next';

interface Instructor {
  id: string;
  name: string;
  avatar_url?: string;
}

interface InstructorSelectProps extends Omit<SelectProps, 'options'> {
  onInstructorLoad?: (instructors: Instructor[]) => void;
}

export const InstructorSelect = forwardRef<HTMLSelectElement, InstructorSelectProps>(
  ({ onInstructorLoad, ...props }, ref) => {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
      async function fetchInstructors() {
        try {
          const response = await fetch('/api/instructors');
          if (!response.ok) throw new Error('Failed to fetch instructors');
          const data = await response.json();
          setInstructors(data);
          if (onInstructorLoad) onInstructorLoad(data);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      }

      fetchInstructors();
    }, [onInstructorLoad]);

    const options = instructors.map(inst => ({
      value: inst.id,
      label: inst.name
    }));

    if (error) {
      return <div className="text-red-500 text-sm">{t('common.errorLoadingInstructors')}</div>;
    }

    return (
      <Select
        ref={ref}
        {...props}
        options={options}
        disabled={loading || props.disabled}
        placeholder={loading ? t('common.loading') : (props.placeholder || t('registerPage.selectInstructor'))}
      />
    );
  }
);
