'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';

interface FormInputProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  className?: string;
  autoComplete?: string;
}

export default function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  success = false,
  disabled = false,
  required = false,
  icon,
  className = '',
  autoComplete
}: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const inputVariants = {
    initial: { scale: 1 },
    focused: { scale: 1.02 },
    error: { x: [-10, 10, -10, 10, 0] }
  };

  const labelVariants = {
    initial: { y: 0, color: '#6B7280' },
    focused: { y: -8, color: '#3B82F6' },
    error: { y: -8, color: '#EF4444' },
    success: { y: -8, color: '#10B981' }
  };

  const getBorderColor = () => {
    if (error) return 'border-red-500 focus:border-red-500';
    if (success) return 'border-green-500 focus:border-green-500';
    if (isFocused) return 'border-blue-500 focus:border-blue-500';
    return 'border-gray-300 focus:border-blue-500';
  };

  const getLabelColor = () => {
    if (error) return 'text-red-600';
    if (success) return 'text-green-600';
    if (isFocused) return 'text-blue-600';
    return 'text-gray-500';
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      variants={inputVariants}
      initial="initial"
      animate={error ? "error" : isFocused ? "focused" : "initial"}
      transition={{ duration: 0.2 }}
    >
      {/* Label */}
      <motion.label
        className={`absolute left-3 text-sm font-medium transition-all duration-200 pointer-events-none ${
          isFocused || value ? 'top-2 text-xs' : 'top-1/2 transform -translate-y-1/2'
        } ${getLabelColor()}`}
        variants={labelVariants}
        initial="initial"
        animate={
          error ? "error" : 
          success ? "success" : 
          isFocused ? "focused" : "initial"
        }
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </motion.label>

      {/* Input Container */}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? placeholder : ''}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            w-full px-4 py-3 border-2 rounded-xl transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${getBorderColor()}
            ${isFocused || value ? 'pt-6 pb-2' : ''}
          `}
        />

        {/* Success/Error Icons */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 