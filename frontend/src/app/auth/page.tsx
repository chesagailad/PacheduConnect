'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Notification from '../../components/Notification';

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
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  // Validate phone number format (must start with + and have country code)
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  };

  const showNotificationMessage = (type: 'success' | 'error', message: string) => {
    setNotificationType(type);
    setError(type === 'error' ? message : '');
    setSuccess(type === 'success' ? message : '');
    setShowNotification(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'register') {
        if (form.password !== form.confirmPassword) {
          showNotificationMessage('error', 'Passwords do not match');
          setLoading(false);
          return;
        }

        // Validate phone number
        if (!form.phoneNumber.trim()) {
          showNotificationMessage('error', 'Phone number is required');
          setLoading(false);
          return;
        }

        if (!validatePhoneNumber(form.phoneNumber.trim())) {
          showNotificationMessage('error', 'Please enter a valid phone number with country code (e.g., +1234567890)');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            phoneNumber: form.phoneNumber.trim()
          }),
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          showNotificationMessage('success', 'Account created successfully!');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          showNotificationMessage('error', data.message);
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
          showNotificationMessage('success', 'Login successful!');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          showNotificationMessage('error', data.message);
        }
      } else if (mode === 'send-otp') {
        const response = await fetch(`${API_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });

        const data = await response.json();
        if (response.ok) {
          showNotificationMessage('success', `OTP sent to ${data.maskedPhone}`);
          setMode('verify-otp');
        } else {
          showNotificationMessage('error', data.message);
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
          showNotificationMessage('success', 'Password reset successfully! You can now login.');
          setTimeout(() => {
            setMode('login');
            setForm({ name: '', email: '', password: '', newPassword: '', confirmPassword: '', phoneNumber: '', otp: '' });
          }, 2000);
        } else {
          showNotificationMessage('error', data.message);
        }
      }
    } catch (error) {
      showNotificationMessage('error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <motion.form onSubmit={handleSubmit} className="space-y-6" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <FormInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) => handleChange('email', value)}
                placeholder="Enter your email address"
                required
                autoComplete="email"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <FormInput
                label="Password"
                type="password"
                value={form.password}
                onChange={(value) => handleChange('password', value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Button
                loading={loading}
                disabled={loading}
                fullWidth
                size="lg"
              >
                Sign In
              </Button>
            </motion.div>
            
            <motion.div className="text-center space-y-3" variants={itemVariants}>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Don't have an account? Sign up
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => setMode('send-otp')}
                  className="text-gray-600 hover:text-gray-500 text-sm transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </motion.div>
          </motion.form>
        );

      case 'register':
        return (
          <motion.form onSubmit={handleSubmit} className="space-y-6" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <FormInput
                label="Full Name"
                type="text"
                value={form.name}
                onChange={(value) => handleChange('name', value)}
                placeholder="Enter your full name"
                required
                autoComplete="name"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <FormInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) => handleChange('email', value)}
                placeholder="Enter your email address"
                required
                autoComplete="email"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <FormInput
                label="Phone Number"
                type="tel"
                value={form.phoneNumber}
                onChange={(value) => handleChange('phoneNumber', value)}
                placeholder="+27 83 123 4567"
                required
                autoComplete="tel"
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter your phone number with country code (e.g., +27 for South Africa, +1 for US, +44 for UK)
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <FormInput
                label="Password"
                type="password"
                value={form.password}
                onChange={(value) => handleChange('password', value)}
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <FormInput
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={(value) => handleChange('confirmPassword', value)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Button
                loading={loading}
                disabled={loading}
                fullWidth
                size="lg"
              >
                Create Account
              </Button>
            </motion.div>
            
            <motion.div className="text-center" variants={itemVariants}>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Already have an account? Sign in
              </button>
            </motion.div>
          </motion.form>
        );

      case 'send-otp':
        return (
          <motion.form onSubmit={handleSubmit} className="space-y-6" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <FormInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) => handleChange('email', value)}
                placeholder="Enter your email address"
                required
                autoComplete="email"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Button
                loading={loading}
                disabled={loading}
                fullWidth
                size="lg"
              >
                Send OTP
              </Button>
            </motion.div>
            
            <motion.div className="text-center" variants={itemVariants}>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Back to Sign In
              </button>
            </motion.div>
          </motion.form>
        );

      case 'verify-otp':
        return (
          <motion.form onSubmit={handleSubmit} className="space-y-6" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <FormInput
                label="OTP"
                type="text"
                value={form.otp}
                onChange={(value) => handleChange('otp', value)}
                placeholder="Enter 6-digit OTP"
                required
                autoComplete="one-time-code"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <FormInput
                label="New Password"
                type="password"
                value={form.newPassword}
                onChange={(value) => handleChange('newPassword', value)}
                placeholder="Create a new password"
                required
                autoComplete="new-password"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Button
                loading={loading}
                disabled={loading}
                fullWidth
                size="lg"
              >
                Reset Password
              </Button>
            </motion.div>
            
            <motion.div className="text-center space-y-3" variants={itemVariants}>
              <button
                type="button"
                onClick={() => setMode('send-otp')}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Resend OTP
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-gray-600 hover:text-gray-500 text-sm transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </motion.div>
          </motion.form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
              whileHover={{ scale: 1.05 }}
            >
              Pachedu
            </motion.h1>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'login' && 'Welcome back'}
              {mode === 'register' && 'Create your account'}
              {mode === 'send-otp' && 'Reset your password'}
              {mode === 'verify-otp' && 'Enter verification code'}
            </h2>
            <p className="mt-2 text-gray-600">
              {mode === 'login' && 'Sign in to continue to your account'}
              {mode === 'register' && 'Join thousands of users sending money safely'}
              {mode === 'send-otp' && 'We\'ll send you a verification code'}
              {mode === 'verify-otp' && 'Enter the 6-digit code sent to your phone'}
            </p>
          </div>
        </motion.div>
        
        <motion.div
          className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderForm()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Notification */}
      <Notification
        type={notificationType}
        title={notificationType === 'success' ? 'Success!' : 'Error'}
        message={notificationType === 'success' ? success : error}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        duration={5000}
      />
    </div>
  );
} 