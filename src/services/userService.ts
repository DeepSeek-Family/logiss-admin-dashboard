import { mockUsers } from '../data/mockData';

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
  getUsers: (): Promise<User[]> => Promise.resolve([...mockUsers]),

  updateUserStatus: (_id: string, _status: string): Promise<{ success: boolean }> => Promise.resolve({ success: true }),

  inviteUser: (userData: Partial<User>): Promise<User> => Promise.resolve({
    id: `LOG-${Math.floor(Math.random() * 900) + 100}`,
    name: userData.name || 'Unknown',
    email: userData.email || '',
    role: userData.role || 'staff',
    status: 'active',
    lastLogin: 'Never',
    ...userData
  })
};
