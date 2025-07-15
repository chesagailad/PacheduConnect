import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { apiClient } from '@/utils/api';
import { DashboardStats } from '@/types';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import SuperAdminNav from '@/components/SuperAdminNav';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: dashboardData, error } = useQuery(
    'dashboard-stats',
    () => apiClient.getDashboardStats(),
    {
      refetchInterval: 30000,
      onSuccess: (data) => {
        setStats(data.data);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Failed to fetch dashboard stats:', error);
        toast.error('Failed to load dashboard data');
        setLoading(false);
      },
    }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner-lg"></div>
      </div>
    );
  }

  return (
    <Layout sidebar={<SuperAdminNav />}>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome, Super Admin! You have full platform control, including admin management and system analytics.
          </p>
          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
            <strong>Platform Controls:</strong> (Coming soon) Manage admins, view system logs, configure platform settings, and more.
          </div>
        </div>
        {/* Stats and activity components would go here, similar to index.tsx */}
      </div>
    </Layout>
  );
} 