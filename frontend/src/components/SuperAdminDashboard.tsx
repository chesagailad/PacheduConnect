/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: SuperAdminDashboard - handles frontend functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { superAdminService, DashboardStats, SystemHealth } from '../services/superAdminService';
import LoadingSpinner from './LoadingSpinner';

interface SuperAdminDashboardProps {
  className?: string;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ className = '' }) => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [stats, health] = await Promise.all([
        superAdminService.getDashboardStats(),
        superAdminService.getSystemHealth()
      ]);
      
      setDashboardStats(stats);
      setSystemHealth(health);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-ZA').format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-600">
          <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h2>
          <div className="flex items-center space-x-2">
            <CogIcon className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-600">System Overview</span>
          </div>
        </div>
        
        {/* System Health Status */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center p-3 rounded-lg border">
              <div className={`p-2 rounded-full ${getStatusColor(systemHealth.system.database)}`}>
                <CheckCircleIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Database</p>
                <p className="text-sm text-gray-600 capitalize">{systemHealth.system.database}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 rounded-lg border">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Uptime</p>
                <p className="text-sm text-gray-600">
                  {Math.floor(systemHealth.system.uptime / 3600)}h {Math.floor((systemHealth.system.uptime % 3600) / 60)}m
                </p>
              </div>
            </div>
            
            <div className="flex items-center p-3 rounded-lg border">
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <ChartBarIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Memory</p>
                <p className="text-sm text-gray-600">
                  {Math.round(systemHealth.system.memory.heapUsed / 1024 / 1024)}MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Statistics */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(dashboardStats.users.total)}</p>
                <p className="text-sm text-green-600">+{dashboardStats.users.growth}% growth</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <span>Active: {formatNumber(dashboardStats.users.active)}</span>
            </div>
          </div>

          {/* KYC Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">KYC Verifications</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(dashboardStats.kyc.total)}</p>
                <p className="text-sm text-yellow-600">{formatNumber(dashboardStats.kyc.pending)} pending</p>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Bronze: {dashboardStats.kyc.breakdown.bronze.approved}</span>
                <span className="text-gray-600">Silver: {dashboardStats.kyc.breakdown.silver.approved}</span>
                <span className="text-gray-600">Gold: {dashboardStats.kyc.breakdown.gold.approved}</span>
              </div>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(dashboardStats.transactions.total)}</p>
                <p className="text-sm text-green-600">{formatNumber(dashboardStats.transactions.monthly)} this month</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <span>Total: {formatCurrency(dashboardStats.transactions.totalAmount)}</span>
            </div>
          </div>

          {/* Payments Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payments</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(dashboardStats.payments.total)}</p>
                <p className="text-sm text-green-600">{dashboardStats.payments.successRate}% success rate</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <span>Total: {formatCurrency(dashboardStats.payments.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* KYC Breakdown */}
      {dashboardStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Level Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bronze Level */}
            <div className="border border-amber-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-amber-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-gray-900">Bronze</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium">{dashboardStats.kyc.breakdown.bronze.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-medium text-green-600">{dashboardStats.kyc.breakdown.bronze.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rejected:</span>
                  <span className="font-medium text-red-600">{dashboardStats.kyc.breakdown.bronze.rejected}</span>
                </div>
              </div>
            </div>

            {/* Silver Level */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-gray-900">Silver</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium">{dashboardStats.kyc.breakdown.silver.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-medium text-green-600">{dashboardStats.kyc.breakdown.silver.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rejected:</span>
                  <span className="font-medium text-red-600">{dashboardStats.kyc.breakdown.silver.rejected}</span>
                </div>
              </div>
            </div>

            {/* Gold Level */}
            <div className="border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-gray-900">Gold</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium">{dashboardStats.kyc.breakdown.gold.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-medium text-green-600">{dashboardStats.kyc.breakdown.gold.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rejected:</span>
                  <span className="font-medium text-red-600">{dashboardStats.kyc.breakdown.gold.rejected}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {systemHealth && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last 24h)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-semibold text-gray-900">{systemHealth.metrics.last24h.newUsers}</p>
              <p className="text-sm text-gray-600">New Users</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <ShieldCheckIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-semibold text-gray-900">{systemHealth.metrics.last24h.newKYC}</p>
              <p className="text-sm text-gray-600">New KYC</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-semibold text-gray-900">{systemHealth.metrics.last24h.newTransactions}</p>
              <p className="text-sm text-gray-600">New Transactions</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard; 