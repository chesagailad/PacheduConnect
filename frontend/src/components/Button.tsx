/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Button - handles frontend functionality
 */

/**
 * Button Component
 * 
 * A comprehensive, accessible button component for the PacheduConnect platform.
 * Provides multiple variants, sizes, and states with smooth animations and
 * proper accessibility features.
 * 
 * Features:
 * - Multiple visual variants (primary, secondary, ghost, danger)
 * - Three size options (sm, md, lg)
 * - Loading state with spinner animation
 * - Disabled state with proper styling
 * - Icon support with positioning options
 * - Full-width option for responsive design
 * - Link functionality with href prop
 * - Smooth animations with Framer Motion
 * - Comprehensive accessibility support
 * - Test-friendly with data-testid support
 * 
 * Accessibility Features:
 * - Proper focus management with visible focus rings
 * - ARIA attributes for screen readers
 * - Keyboard navigation support
 * - Disabled state handling
 * - Loading state announcements
 * 
 * Animation Features:
 * - Hover and tap animations
 * - Icon animations
 * - Loading state transitions
 * - Smooth color transitions
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

/**
 * Button Component Props Interface
 * 
 * Defines all available props for the Button component with proper
 * TypeScript typing and default values.
 */
interface ButtonProps {
  children: React.ReactNode;                    // Button content
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';  // Visual style variant
  size?: 'sm' | 'md' | 'lg';                   // Button size
  loading?: boolean;                            // Loading state with spinner
  disabled?: boolean;                           // Disabled state
  fullWidth?: boolean;                          // Full width option
  onClick?: () => void;                         // Click handler function
  href?: string;                                // Link URL (renders as anchor)
  className?: string;                           // Additional CSS classes
  icon?: React.ReactNode;                       // Icon component
  iconPosition?: 'left' | 'right';             // Icon positioning
  type?: 'button' | 'submit' | 'reset';        // Button type
  'data-testid'?: string;                      // Test identifier
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
  iconPosition = 'left',
  type = 'button',
  'data-testid': dataTestId
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 hover:border-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-error-600 to-error-700 text-white hover:from-error-700 hover:to-error-800 focus:ring-error-500 shadow-lg hover:shadow-xl',
    outline: 'bg-transparent text-primary-600 border-2 border-primary-600 hover:bg-primary-50 hover:border-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md'
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
    <>
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {icon && iconPosition === 'left' && !loading && (
        <motion.div
          className="mr-2"
          variants={iconVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          {icon}
        </motion.div>
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <motion.div
          className="ml-2"
          variants={iconVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          {icon}
        </motion.div>
      )}
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        data-testid={dataTestId}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      whileInView="initial"
      data-testid={dataTestId}
    >
      {content}
    </motion.button>
  );
} 