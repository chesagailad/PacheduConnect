/**
 * Navigation Component
 * 
 * A responsive navigation header component for the PacheduConnect platform.
 * Provides consistent navigation across all pages with user information,
 * notification access, and logout functionality.
 * 
 * Features:
 * - Responsive design with mobile-friendly layout
 * - Dynamic title display
 * - Optional back button with custom routing
 * - User information display
 * - Notification bell integration
 * - Logout functionality with token cleanup
 * - Smooth transitions and hover effects
 * 
 * Navigation Elements:
 * - Back button (optional) with custom URL routing
 * - Page title with consistent styling
 * - User welcome message
 * - Notification bell component
 * - Logout button with proper cleanup
 * 
 * User Experience:
 * - Clear visual hierarchy
 * - Intuitive navigation patterns
 * - Consistent branding and styling
 * - Accessible keyboard navigation
 * - Mobile-responsive design
 * 
 * Security Features:
 * - Secure logout with token removal
 * - Proper session cleanup
 * - Redirect to authentication page
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell';

/**
 * Navigation Component Props Interface
 * 
 * Defines the props for the Navigation component with proper
 * TypeScript typing and default values.
 */
interface NavigationProps {
  title: string;                              // Page title to display
  showBackButton?: boolean;                   // Whether to show back button
  backUrl?: string;                           // URL for back button navigation
  user?: {                                    // User information object
    name: string;                             // User's display name
    email: string;                            // User's email address
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