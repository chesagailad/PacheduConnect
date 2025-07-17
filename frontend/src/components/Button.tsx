'use client';

import React from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  href,
  className = '',
  icon,
  iconPosition = 'left'
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-500 shadow-lg hover:shadow-xl'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.02,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)"
    },
    tap: { scale: 0.98 },
    loading: { scale: 0.98 }
  };

  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.9 }
  };

  const content = (
    <motion.div
      className="flex items-center justify-center space-x-2"
      initial="initial"
      whileHover="hover"
      whileTap="tap"
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" color="white" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <motion.span variants={iconVariants}>
              {icon}
            </motion.span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <motion.span variants={iconVariants}>
              {icon}
            </motion.span>
          )}
        </>
      )}
    </motion.div>
  );

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

  if (href) {
    return (
      <motion.a
        href={href}
        className={buttonClasses}
        variants={buttonVariants}
        initial="initial"
        whileHover={disabled || loading ? "initial" : "hover"}
        whileTap={disabled || loading ? "initial" : "tap"}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      variants={buttonVariants}
      initial="initial"
      whileHover={disabled || loading ? "initial" : "hover"}
      whileTap={disabled || loading ? "initial" : "tap"}
      animate={loading ? "loading" : "initial"}
    >
      {content}
    </motion.button>
  );
} 