/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Enhanced auth page with professional, calm, and elegant design
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_CONFIG } from '@/config/api';

const API_URL = API_CONFIG.BASE_URL;

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'send-otp' | 'verify-otp'>('login');
  
  useEffect(() => {
    const modeParam = searchParams?.get('mode');
    if (modeParam === 'register') {
      setMode('register');
    } else if (modeParam === 'login') {
      setMode('login');
    }
  }, [searchParams]);

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
          setSuccess('OTP sent to your email');
          setMode('verify-otp');
        } else {
          setError(data.message);
        }
      } else if (mode === 'verify-otp') {
        const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: form.email,
            otp: form.otp 
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setMode('reset-password');
        } else {
          setError(data.message);
        }
      } else if (mode === 'reset-password') {
        if (form.newPassword !== form.confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: form.email,
            otp: form.otp,
            newPassword: form.newPassword 
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setSuccess('Password reset successfully');
          setMode('login');
        } else {
          setError(data.message);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-4 px-6 rounded-2xl hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
            <div className="space-y-4 text-center">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors hover:underline"
              >
                Don't have an account? Sign up
              </button>
              <div className="text-slate-300">•</div>
              <button
                type="button"
                onClick={() => setMode('send-otp')}
                className="text-slate-600 hover:text-slate-800 transition-colors hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        );

      case 'register':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Phone Number (optional)</label>
              <input
                type="tel"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="+1234567890"
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Create a strong password"
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-4 px-6 rounded-2xl hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors hover:underline"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        );

      case 'send-otp':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-4 px-6 rounded-2xl hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending OTP...</span>
                </div>
              ) : (
                'Send OTP'
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        );

      case 'verify-otp':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">OTP Code</label>
              <input
                type="text"
                name="otp"
                value={form.otp}
                onChange={handleChange}
                required
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm text-center text-2xl font-mono tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-4 px-6 rounded-2xl hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify OTP'
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('send-otp')}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </form>
        );

      case 'reset-password':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                placeholder="Enter new password"
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm new password"
                className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-4 px-6 rounded-2xl hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting...</span>
                </div>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Navigation Header */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Pachedu</span>
                <div className="text-xs text-slate-500 font-medium">Connect</div>
              </div>
            </Link>
            <Link
              href="/"
              className="flex items-center space-x-2 text-slate-600 hover:text-primary-600 transition-all duration-300 font-medium px-4 py-2 rounded-lg hover:bg-slate-100/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left Side - Branding & Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-16 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          </div>
          
          <div className="flex flex-col justify-center max-w-md relative z-10">
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-5xl font-bold text-white mb-2">
                    Welcome to
                  </h1>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                    PacheduConnect
                  </h2>
                </div>
              </div>
              <p className="text-slate-300 text-xl leading-relaxed font-light">
                Send money to Zimbabwe, Malawi, and Mozambique with real-time SMS alerts.
                Fast, secure, and reliable remittance platform.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Secure & Encrypted</h3>
                  <p className="text-slate-300 text-sm">Bank-level security for your transactions</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Instant Transfers</h3>
                  <p className="text-slate-300 text-sm">Real-time processing and notifications</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">24/7 Support</h3>
                  <p className="text-slate-300 text-sm">Round-the-clock customer assistance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-white font-bold text-2xl">P</span>
                </div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Pachedu</div>
                  <div className="text-sm text-slate-500 font-medium">Connect</div>
                </div>
              </div>
            </div>

            {/* Form Container */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-white/20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                  {mode === 'login' && 'Welcome Back'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'send-otp' && 'Reset Password'}
                  {mode === 'verify-otp' && 'Enter OTP'}
                  {mode === 'reset-password' && 'Set New Password'}
                </h2>
                <p className="text-slate-600 text-lg">
                  {mode === 'login' && 'Sign in to your PacheduConnect account'}
                  {mode === 'register' && 'Join thousands of users sending money home'}
                  {mode === 'send-otp' && 'We\'ll send you a verification code'}
                  {mode === 'verify-otp' && 'Enter the 6-digit code we sent you'}
                  {mode === 'reset-password' && 'Create a new secure password'}
                </p>
              </div>

              {error && (
                <div className="mb-8 bg-red-50/80 border border-red-200/50 text-red-700 px-6 py-4 rounded-2xl flex items-center space-x-3 backdrop-blur-sm">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-8 bg-emerald-50/80 border border-emerald-200/50 text-emerald-700 px-6 py-4 rounded-2xl flex items-center space-x-3 backdrop-blur-sm">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">{success}</span>
                </div>
              )}

              {renderForm()}
            </div>

            {/* Footer */}
            <div className="mt-10 text-center">
              <p className="text-slate-500 text-sm leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 