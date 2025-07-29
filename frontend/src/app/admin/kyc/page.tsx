/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: page - handles frontend functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  UsersIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Navigation from '../../../components/Navigation';
import KYCAdminPanel from '../../../components/KYCAdminPanel';

interface KYCStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  bronze: number;
  silver: number;
  gold: number;
}

export default function AdminKYCPage() {
  const [stats, setStats] = useState<KYCStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    bronze: 0,
    silver: 0,
    gold: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    fetchKYCStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchKYCStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/kyc/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching KYC stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    color: string; 
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Navigation 
        title="Admin - KYC Management" 
        showBackButton={true} 
        user={user}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Management</h1>
          <p className="text-gray-600">
            Manage user KYC verifications and monitor compliance status.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total KYC"
            value={stats.total}
            icon={UsersIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={ClockIcon}
            color="bg-yellow-500"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircleIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircleIcon}
            color="bg-red-500"
          />
        </div>

        {/* KYC Level Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Level Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-amber-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Bronze</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.bronze}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Silver</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.silver}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Gold</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.gold}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">View All KYC Records</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">Generate KYC Report</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-yellow-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">Pending Verifications</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* KYC Admin Panel */}
        <KYCAdminPanel />
      </div>
    </div>
  );
} 