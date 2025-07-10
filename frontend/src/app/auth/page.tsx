'use client';

import React, { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'send-otp' | 'verify-otp'>('login');
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    newPassword: '', 
    confirmPassword: '',
    phoneNumber: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'register') {
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            phoneNumber: form.phoneNumber
          }),
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          window.location.href = '/dashboard';
        } else {
          setError(data.message);
        }
      } else if (mode === 'login') {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          window.location.href = '/dashboard';
        } else {
          setError(data.message);
        }
      } else if (mode === 'send-otp') {
        const response = await fetch(`${API_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });

        const data = await response.json();
        if (response.ok) {
          setSuccess(`OTP sent to ${data.phoneNumber}`);
          setMode('verify-otp');
        } else {
          setError(data.message);
        }
      } else if (mode === 'verify-otp') {
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            otp: form.otp,
            newPassword: form.newPassword,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setSuccess('Password reset successfully! You can now login.');
          setMode('login');
          setForm({ name: '', email: '', password: '', newPassword: '', confirmPassword: '', phoneNumber: '', otp: '' });
        } else {
          setError(data.message);
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Don't have an account? Sign up
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('send-otp')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        );

      case 'register':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number (optional)</label>
              <input
                type="tel"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="+1234567890"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        );

      case 'send-otp':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        );

      case 'verify-otp':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">OTP</label>
              <input
                type="text"
                name="otp"
                value={form.otp}
                onChange={handleChange}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Resetting password...' : 'Reset Password'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('send-otp')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Resend OTP
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'register' && 'Create your account'}
            {mode === 'send-otp' && 'Reset Password'}
            {mode === 'verify-otp' && 'Enter OTP'}
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {renderForm()}
      </div>
    </div>
  );
} 