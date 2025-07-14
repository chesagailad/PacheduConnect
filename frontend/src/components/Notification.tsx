'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  className?: string;
}

export default function Notification({
  type,
  title,
  message,
  isVisible,
  onClose,
  duration = 5000,
  className = ''
}: NotificationProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const typeConfig = {
    success: {
      icon: '✅',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    error: {
      icon: '❌',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600'
    },
    warning: {
      icon: '⚠️',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    }
  };

  const config = typeConfig[type];

  const notificationVariants = {
    hidden: { 
      opacity: 0, 
      y: -50, 
      scale: 0.9,
      x: '100%'
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      y: -50, 
      scale: 0.9,
      x: '100%',
      transition: {
        duration: 0.2
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
        damping: 20,
        delay: 0.1
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed top-4 right-4 z-50 max-w-sm w-full ${className}`}
          variants={notificationVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={`${config.bgColor} ${config.borderColor} border rounded-xl shadow-lg p-4`}>
            <div className="flex items-start space-x-3">
              <motion.div
                className={`text-xl ${config.iconColor}`}
                variants={iconVariants}
                initial="initial"
                animate="animate"
              >
                {config.icon}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <motion.h3 
                  className={`text-sm font-semibold ${config.textColor}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {title}
                </motion.h3>
                
                {message && (
                  <motion.p 
                    className={`text-sm mt-1 ${config.textColor} opacity-80`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {message}
                  </motion.p>
                )}
              </div>
              
              <motion.button
                onClick={onClose}
                className={`text-gray-400 hover:text-gray-600 transition-colors ${config.iconColor} hover:${config.iconColor}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 