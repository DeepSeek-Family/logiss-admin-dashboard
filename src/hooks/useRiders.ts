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

  const updateRiderStatus = (riderId: string, newStatus: string) => {
    setRiders(prev => prev.map(r => r.id === riderId ? { ...r, status: newStatus } : r));
  };

  const updateRider = (riderId: string, updatedFields: Partial<any>) => {
    setRiders(prev => prev.map(r => r.id === riderId ? { ...r, ...updatedFields } : r));
  };

  return { riders, loading, error, updateRiderStatus, updateRider };
};
