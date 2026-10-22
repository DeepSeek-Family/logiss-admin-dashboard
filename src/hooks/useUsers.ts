import { useState } from 'react';
import {
  useGetDispatchersQuery,
  useCreateDispatcherMutation,
  useDeleteDispatcherMutation,
} from '@/redux/api/dispatcherManagementApi';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  contact?: string;
  role: string;
  roleLabel?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  permissions?: string[];
}

export const useUsers = () => {
  const { data: apiResponse, isLoading: apiLoading, refetch } = useGetDispatchersQuery();
  const [createDispatcher] = useCreateDispatcherMutation();
  const [deleteDispatcher] = useDeleteDispatcherMutation();
  const [error, setError] = useState<string | null>(null);

  const users: User[] = (apiResponse?.data || []).map((d) => ({
    id: d._id || d.id || '',
    name: [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ') || 'Dispatcher User',
    firstName: d.firstName,
    middleName: d.middleName,
    lastName: d.lastName,
    email: d.email,
    contact: d.contact,
    role: (d.role || d.middleName || 'dispatcher').toLowerCase(),
    roleLabel: (d.middleName || d.role || 'Dispatcher').trim(),
    status: d.isBanned ? 'inactive' : 'active',
    lastLogin: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Active',
    permissions: d.accessScope || [],
  }));

  const toggleStatus = async (id: string) => {
    try {
      await deleteDispatcher(id).unwrap();
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update user status';
      setError(message);
    }
  };

  const inviteUser = async (userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    contact?: string;
    permissions?: string[];
    role?: string;
  }) => {
    try {
      const firstName = (userData.firstName || '').trim() || 'User';
      const lastName = (userData.lastName || '').trim() || firstName;

      const rawPermissions: string[] = userData.permissions?.length
        ? userData.permissions
        : ['/dashboard', '/operations', '/bookings', '/drivers', '/riders'];

      const accessScope = rawPermissions.map((p: string) => (p.startsWith('/') ? p : `/${p}`));

      const roleText = (userData.role || '').trim();

      const payload = {
        firstName,
        middleName: roleText,
        lastName,
        email: userData.email || '',
        password: userData.password || 'Password@123',
        contact: userData.contact || '+8801609502136',
        accessScope,
      };

      const result = await createDispatcher(payload).unwrap();
      refetch();
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to invite user';
      setError(message);
      throw err;
    }
  };

  return { users, loading: apiLoading, error, toggleStatus, inviteUser, refetch };
};
