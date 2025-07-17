'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell';

interface NavigationProps {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
  user?: {
    name: string;
    email: string;
  } | null;
}

const Navigation: React.FC<NavigationProps> = ({ 
  title, 
  showBackButton = false, 
  backUrl = '/dashboard',
  user 
}) => {
  const router = useRouter();

  const handleBack = () => {
    router.push(backUrl);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back
              </button>
            )}
            <h1 className="text-2xl font-bold text-primary-600">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-gray-700">Welcome, {user.name}</span>
            )}
            <NotificationBell onNotificationClick={(notification) => {
              console.log('Notification clicked:', notification);
            }} />
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation; 