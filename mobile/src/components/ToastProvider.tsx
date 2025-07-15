import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const theme = useTheme();

  const showToast = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-hide toast after duration
    setTimeout(() => {
      hideToast(id);
    }, duration);
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return theme.colors.tertiary;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.secondary;
      case 'info':
      default:
        return theme.colors.primary;
    }
  };

  const getToastBackground = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return theme.colors.tertiaryContainer;
      case 'error':
        return theme.colors.errorContainer;
      case 'warning':
        return theme.colors.secondaryContainer;
      case 'info':
      default:
        return theme.colors.primaryContainer;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <View style={styles.toastContainer}>
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onHide={() => hideToast(toast.id)}
            color={getToastColor(toast.type)}
            backgroundColor={getToastBackground(toast.type)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  onHide: () => void;
  color: string;
  backgroundColor: string;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onHide, color, backgroundColor }) => {
  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor,
          borderLeftColor: color,
        },
      ]}
    >
      <Text style={[styles.toastText, { color: theme.colors.onSurface }]}>
        {toast.message}
      </Text>
      <TouchableOpacity onPress={onHide} style={styles.closeButton}>
        <Text style={[styles.closeText, { color }]}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 
 