import { useEffect, useState } from 'react';
import { apiClient } from '@/utils/api';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getUsers();
      setUsers(res.data);
    } catch (err: any) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend(id: string) {
    try {
      await apiClient.suspendUser(id);
      toast.success('User suspended');
      fetchUsers();
    } catch {
      toast.error('Failed to suspend user');
    }
  }

  async function handleActivate(id: string) {
    try {
      await apiClient.activateUser(id);
      toast.success('User activated');
      fetchUsers();
    } catch {
      toast.error('Failed to activate user');
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading users...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phoneNumber}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>
                  {user.status === 'active' ? (
                    <button className="btn btn-danger btn-xs mr-2" onClick={() => handleSuspend(user.id)}>
                      <UserMinusIcon className="h-4 w-4 mr-1" /> Suspend
                    </button>
                  ) : (
                    <button className="btn btn-success btn-xs" onClick={() => handleActivate(user.id)}>
                      <UserPlusIcon className="h-4 w-4 mr-1" /> Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 