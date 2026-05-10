import { useState, useEffect } from 'react';
import { riders as initialRiders } from '../data/mockData';

export const useRiders = () => {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRiders(initialRiders);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  }, []);

  return { riders, loading, error };
};
