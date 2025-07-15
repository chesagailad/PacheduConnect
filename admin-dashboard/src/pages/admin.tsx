import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { apiClient } from '@/utils/api';
import { DashboardStats } from '@/types';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import AdminNav from '@/components/AdminNav';

export default function AdminDashboard() {
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
    <Layout sidebar={<AdminNav />}>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome, Admin! Here you can manage users, review KYC, and monitor transactions.
          </p>
        </div>
        {/* Stats and activity components would go here, similar to index.tsx */}
      </div>
    </Layout>
  );
} 