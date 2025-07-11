'use client';

import React, { useState } from 'react';
import { 
  ChartBarIcon,
  UsersIcon,
  CogIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import SuperAdminDashboard from '../../components/SuperAdminDashboard';
import SuperAdminUserManagement from '../../components/SuperAdminUserManagement';
import SuperAdminSystemSettings from '../../components/SuperAdminSystemSettings';

type TabType = 'dashboard' | 'users' | 'settings';

const SuperAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    {
      id: 'dashboard' as TabType,
      name: 'Dashboard',
      icon: ChartBarIcon,
      description: 'System overview and statistics'
    },
    {
      id: 'users' as TabType,
      name: 'User Management',
      icon: UsersIcon,
      description: 'Manage users and roles'
    },
    {
      id: 'settings' as TabType,
      name: 'System Settings',
      icon: CogIcon,
      description: 'Configure system settings'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SuperAdminDashboard />;
      case 'users':
        return <SuperAdminUserManagement />;
      case 'settings':
        return <SuperAdminSystemSettings />;
      default:
        return <SuperAdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-8 w-8 text-red-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">Super Admin</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <HomeIcon className="h-4 w-4 mr-1" />
                <span>System Administration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <div
                  key={tab.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    activeTab === tab.id
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        activeTab === tab.id ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          activeTab === tab.id ? 'text-red-900' : 'text-gray-900'
                        }`}>
                          {tab.name}
                        </p>
                        <p className="text-xs text-gray-500">{tab.description}</p>
                      </div>
                    </div>
                    {activeTab === tab.id && (
                      <ArrowRightIcon className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Super Admin Panel • PacheduConnect
            </div>
            <div className="text-sm text-gray-500">
              System Administration Tools
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage; 