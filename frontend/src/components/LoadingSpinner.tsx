/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: LoadingSpinner - handles frontend functionality
 */

/**
 * Loading Spinner Component
 * 
 * A reusable loading spinner component for the PacheduConnect platform.
 * Provides smooth rotation animation with multiple size and color options,
 * designed for optimal user experience during loading states.
 * 
 * Features:
 * - Smooth rotation animation using Framer Motion
 * - Three size options (sm, md, lg)
 * - Multiple color themes (primary, white, blue)
 * - Accessible with proper ARIA attributes
 * - Customizable with additional CSS classes
 * - Optimized performance with CSS transforms
 * 
 * Accessibility Features:
 * - Proper ARIA role and label for screen readers
 * - Semantic loading indication
 * - Keyboard navigation support
 * 
 * Animation Features:
 * - Continuous 360-degree rotation
 * - Smooth linear easing for consistent speed
 * - Infinite loop animation
 * - Hardware-accelerated transforms
 * 
 * Use Cases:
 * - Button loading states
 * - Page loading indicators
 * - Form submission feedback
 * - Data fetching states
 * - Component initialization
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Loading Spinner Props Interface
 * 
 * Defines the props for the LoadingSpinner component with proper
 * TypeScript typing and default values.
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';        // Spinner size variant
  color?: 'primary' | 'white' | 'blue';  // Color theme
  className?: string;                 // Additional CSS classes
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'border-primary-600',
    white: 'border-white',
    blue: 'border-blue-600'
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-gray-300 rounded-full ${className}`}
      variants={spinnerVariants}
      animate="animate"
      role="status"
      aria-label="Loading"
    />
  );
} 