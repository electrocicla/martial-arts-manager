import { useState, useEffect } from 'react';
import { classService, type ClassMetadata } from '../services';

interface UseClassMetadataReturn {
  disciplines: string[];
  locations: string[];
  instructors: string[];
  isLoading: boolean;
  error: string | null;
}

export function useClassMetadata(): UseClassMetadataReturn {
  const [metadata, setMetadata] = useState<ClassMetadata>({
    disciplines: [],
    locations: [],
    instructors: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await classService.getMetadata();
        if (response.success && response.data) {
          setMetadata(response.data);
        } else {
          setError(response.error || 'Failed to fetch class metadata');
          // Use defaults if API fails
          setMetadata({
            disciplines: ['Brazilian Jiu-Jitsu', 'Kickboxing', 'Muay Thai', 'MMA', 'Karate'],
            locations: ['Main Dojo', 'Training Hall', 'Outdoor Area', 'Gym Floor'],
            instructors: ['Sensei Yamamoto', 'Coach Johnson', 'Master Chen', 'Instructor Davis'],
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        // Use defaults if error
        setMetadata({
          disciplines: ['Brazilian Jiu-Jitsu', 'Kickboxing', 'Muay Thai', 'MMA', 'Karate'],
          locations: ['Main Dojo', 'Training Hall', 'Outdoor Area', 'Gym Floor'],
          instructors: ['Sensei Yamamoto', 'Coach Johnson', 'Master Chen', 'Instructor Davis'],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  return {
    disciplines: metadata.disciplines,
    locations: metadata.locations,
    instructors: metadata.instructors,
    isLoading,
    error,
  };
}
