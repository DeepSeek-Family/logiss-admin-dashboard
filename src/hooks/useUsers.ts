import { useState, useEffect } from 'react';
import { env } from '@/config/env';
import {
  useGetDispatchersQuery,
  useCreateDispatcherMutation,
  useDeleteDispatcherMutation,
} from '@/redux/api/dispatcherManagementApi';
import { User, userService } from '../services/userService';

export const useUsers = () => {
  const { data: apiResponse, isLoading: apiLoading, refetch } = useGetDispatchersQuery();
  const [createDispatcher] = useCreateDispatcherMutation();
  const [deleteDispatcher] = useDeleteDispatcherMutation();

  const [mockUsers, setMockUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const dispatchersList: User[] = (apiResponse?.data || []).map((d) => ({
    id: d._id || d.id || '',
    name: [d.firstName, d.lastName].filter(Boolean).join(' ') || 'Dispatcher User',
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    contact: d.contact,
    role: (d.role || 'dispatcher').toLowerCase(),
    status: d.isBanned ? 'inactive' : 'active',
    lastLogin: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Active',
    permissions: d.accessScope || [],
  }));

  useEffect(() => {
    if (env.useMock) {
      const fetchMock = async () => {
        try {
          setLoading(true);
          const data = await userService.getUsers();
          setMockUsers(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchMock();
    } else {
      setLoading(apiLoading);
    }
  }, [apiLoading]);

  const users = !env.useMock && dispatchersList.length > 0 ? dispatchersList : mockUsers;

  const toggleStatus = async (id: string) => {
    try {
      if (!env.useMock) {
        await deleteDispatcher(id).unwrap();
        refetch();
      } else {
        const user = users.find((u: User) => u.id === id);
        if (!user) return;
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        await userService.updateUserStatus(id, newStatus);
        setMockUsers((prev: User[]) => prev.map((u: User) => (u.id === id ? { ...u, status: newStatus } : u)));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const inviteUser = async (userData: any) => {
    try {
      if (!env.useMock) {
        const nameParts = (userData.name || '').trim().split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || firstName;

        const rawPermissions: string[] = userData.permissions?.length
          ? userData.permissions
          : ['/dashboard', '/operations', '/bookings', '/drivers', '/riders'];

        const accessScope = rawPermissions.map((p: string) => (p.startsWith('/') ? p : `/${p}`));

        const payload = {
          firstName,
          lastName,
          email: userData.email,
          password: userData.password || 'Password@123',
          contact: userData.contact || '+8801609502136',
          accessScope,
        };

        const result = await createDispatcher(payload).unwrap();
        refetch();
        return result;
      } else {
        const newUser = await userService.inviteUser(userData);
        setMockUsers((prev: User[]) => [...prev, newUser]);
        return newUser;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to invite user');
      throw err;
    }
  };

  return { users, loading: env.useMock ? loading : apiLoading, error, toggleStatus, inviteUser, refetch };
};
