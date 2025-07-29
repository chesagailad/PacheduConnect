/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: ProgressIndicator - handles frontend functionality
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  status?: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProgressIndicator({
  progress,
  status = 'uploading',
  message,
  showPercentage = true,
  size = 'md',
  className = ''
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const statusConfig = {
    uploading: {
      color: 'bg-blue-500',
      icon: '📤',
      text: 'Uploading...'
    },
    processing: {
      color: 'bg-yellow-500',
      icon: '⚙️',
      text: 'Processing...'
    },
    complete: {
      color: 'bg-green-500',
      icon: '✅',
      text: 'Complete!'
    },
    error: {
      color: 'bg-red-500',
      icon: '❌',
      text: 'Error'
    }
  };

  const config = statusConfig[status];

  const progressVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${progress}%`,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20
      }
    }
  };

  return (
    <motion.div
      className={`w-full ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Progress Bar */}
      <div className="relative">
        <div className={`w-full ${sizeClasses[size]} bg-gray-200 rounded-full overflow-hidden`}>
          <motion.div
            className={`h-full ${config.color} rounded-full`}
            variants={progressVariants}
            initial="initial"
            animate="animate"
          />
        </div>
        
        {/* Progress Text */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <motion.span
              className="text-lg"
              variants={iconVariants}
              initial="initial"
              animate="animate"
            >
              {config.icon}
            </motion.span>
            <span className="text-sm font-medium text-gray-700">
              {message || config.text}
            </span>
          </div>
          
          {showPercentage && (
            <motion.span
              className="text-sm font-semibold text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {Math.round(progress)}%
            </motion.span>
          )}
        </div>
      </div>

      {/* Status-specific animations */}
      {status === 'complete' && (
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg
              className="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </motion.svg>
          </motion.div>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg
              className="w-5 h-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </motion.svg>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
} 