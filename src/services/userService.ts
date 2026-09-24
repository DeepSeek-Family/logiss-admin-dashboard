import { mockUsers } from '../data/mockData';
import { env } from '@/config/env';
import { api } from '@/services/api';
import { API } from '@/constants/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: string;
  [key: string]: any;
}

export const userService = {
  getUsers: (): Promise<User[]> => {
    if (!env.useMock) return api.get<User[]>(API.users);
    return Promise.resolve([...mockUsers]);
  },

  updateUserStatus: (id: string, status: string): Promise<{ success: boolean }> => {
    if (!env.useMock) return api.patch<{ success: boolean }>(`${API.users}/${id}`, { status });
    return Promise.resolve({ success: true });
  },

  inviteUser: (userData: Partial<User>): Promise<User> => {
    if (!env.useMock) return api.post<User>(API.usersInvite, userData);
    return Promise.resolve({
      id: `LOG-${Math.floor(Math.random() * 900) + 100}`,
      name: userData.name || 'Unknown',
      email: userData.email || '',
      role: userData.role || 'staff',
      status: 'active',
      lastLogin: 'Never',
      ...userData
    });
  }
};
