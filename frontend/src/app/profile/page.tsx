'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface UserStats {
  totalTransactions: number;
  sentTransactions: number;
  receivedTransactions: number;
  sentAmount: number;
  receivedAmount: number;
  thisMonthTransactions: number;
  netAmount: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    fetchUserData(token);
    fetchUserStats(token);
  }, [router]);

  const fetchUserData = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth');
          return;
        }
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await res.json();
      setUser(userData);
      setForm(prev => ({ 
        ...prev, 
        name: userData.name, 
        email: userData.email 
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch user stats:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    try {
      if (passwordMode) {
        // Handle password change
        if (form.newPassword !== form.confirmPassword) {
          setError('New passwords do not match');
          return;
        }

        if (form.newPassword.length < 6) {
          setError('New password must be at least 6 characters long');
          return;
        }

        const res = await fetch(`${API_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          setError(errorData.message || 'Failed to update password');
          return;
        }

        setSuccessMessage('Password updated successfully');
        setPasswordMode(false);
        setForm(prev => ({ 
          ...prev, 
          currentPassword: '', 
          newPassword: '', 
          confirmPassword: '' 
        }));
      } else {
        // Handle profile update
        const res = await fetch(`${API_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          setError(errorData.message || 'Failed to update profile');
          return;
        }

        const updatedUser = await res.json();
        setUser(updatedUser);
        setSuccessMessage('Profile updated successfully');
        setEditMode(false);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth');
  };

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-primary-600">Profile</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Sent</h3>
              <p className="text-2xl font-bold text-red-600">${stats.sentAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">{stats.sentTransactions} transactions</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Received</h3>
              <p className="text-2xl font-bold text-green-600">${stats.receivedAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">{stats.receivedTransactions} transactions</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Net Amount</h3>
              <p className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.netAmount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">This month: {stats.thisMonthTransactions}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Information</h2>
              <p className="text-gray-600">Manage your account details and preferences.</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
                <button onClick={clearMessages} className="text-red-600 hover:text-red-800 text-sm mt-2">
                  Dismiss
                </button>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{successMessage}</p>
                <button onClick={clearMessages} className="text-green-600 hover:text-green-800 text-sm mt-2">
                  Dismiss
                </button>
              </div>
            )}

            {editMode ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Name</label>
                  <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">{user?.name}</p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Email</label>
                  <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">{user?.email}</p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Member Since</label>
                  <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Account ID</label>
                  <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg font-mono text-sm">{user?.id}</p>
                </div>

                <button
                  onClick={() => setEditMode(true)}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Security Settings</h2>
              <p className="text-gray-600">Update your password and security preferences.</p>
            </div>

            {passwordMode ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setPasswordMode(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Account Security</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Your account is protected with industry-standard security measures.
                  </p>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• Password is securely hashed</p>
                    <p>• JWT tokens for session management</p>
                    <p>• HTTPS encryption for all communications</p>
                  </div>
                </div>

                <button
                  onClick={() => setPasswordMode(true)}
                  className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 