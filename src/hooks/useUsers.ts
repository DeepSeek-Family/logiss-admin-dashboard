import { useState, useEffect } from 'react';
import { User, userService } from '../services/userService';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.getUsers();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleStatus = async (id: string) => {
    try {
      const user = users.find((u: User) => u.id === id);
      if (!user) return;
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await userService.updateUserStatus(id, newStatus);
      setUsers((prev: User[]) => prev.map((u: User) => u.id === id ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const inviteUser = async (userData: Partial<User>) => {
    try {
      const newUser = await userService.inviteUser(userData);
      setUsers((prev: User[]) => [...prev, newUser]);
      return newUser;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { users, loading, error, toggleStatus, inviteUser };
};
