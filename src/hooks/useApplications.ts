import { useState, useEffect, useCallback } from 'react';
import { applications as mockApps } from '../data/mockData';

export const useApplications = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(() => {
    try {
      setLoading(true);
      setApplications([...mockApps]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, loading, error, refresh: fetchApplications };
};
