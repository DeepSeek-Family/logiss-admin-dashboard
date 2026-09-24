import { useState, useEffect, useCallback } from 'react';
import { reports as mockReports } from '../data/mockData';

export const useReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(() => {
    try {
      setLoading(true);
      setReports(Array.isArray(mockReports) ? [...mockReports] : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateReportStatus = useCallback((reportId: string, status: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  }, []);

  return { reports, loading, error, refresh: fetchReports, updateReportStatus };
};
