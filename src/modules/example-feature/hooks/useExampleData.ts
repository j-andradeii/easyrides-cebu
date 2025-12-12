/**
 * useExampleData Hook
 *
 * Feature-specific custom hook example
 * Fetches and manages data for this feature
 */

'use client';

import { useState, useEffect } from 'react';
import { exampleService } from '../services/example.service';

interface ExampleData {
  id: string;
  title: string;
  description: string;
}

export function useExampleData(id: string) {
  const [data, setData] = useState<ExampleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await exampleService.getById(id);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, isLoading, error };
}
