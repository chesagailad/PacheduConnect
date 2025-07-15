import { useEffect, useState } from 'react';
import { apiClient } from '@/utils/api';
import { User } from '@/types';
import toast from 'react-hot-toast';

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getUsers({ role: 'admin' });
      setAdmins(res.data);
    } catch (err: any) {
      setError('Failed to load admins');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin() {
    // Placeholder: open modal or form to add admin
    toast('Add admin feature coming soon!');
  }

  async function handleRemoveAdmin(id: string) {
    // Placeholder: call API to remove admin
    toast('Remove admin feature coming soon!');
  }

  if (loading) {
    return <div className="p-8 text-center">Loading admins...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Admins</h2>
      <button className="btn btn-primary mb-4" onClick={handleAddAdmin}>Add Admin</button>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Role</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
              <td className="px-4 py-2 border">{admin.name}</td>
              <td className="px-4 py-2 border">{admin.email}</td>
              <td className="px-4 py-2 border">{admin.role}</td>
              <td className="px-4 py-2 border">
                <button className="btn btn-danger btn-sm" onClick={() => handleRemoveAdmin(admin.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 