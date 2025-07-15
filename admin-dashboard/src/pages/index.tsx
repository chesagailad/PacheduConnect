import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/utils/api';
import { User } from '@/types';

export default function DashboardIndex() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await apiClient.getCurrentUser();
        const user: User = res.data;
        if (user.role === 'super_admin') {
          router.replace('/super-admin');
        } else if (user.role === 'admin') {
          router.replace('/admin');
        } else {
          setError('You do not have access to the admin dashboard.');
        }
      } catch (err) {
        setError('Not authenticated. Please log in.');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-center">
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return null;
} 