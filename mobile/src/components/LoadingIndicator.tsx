import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';

interface LoadingIndicatorProps {
  visible: boolean;
  message?: string;
  progress?: number; // 0-100
  type?: 'spinner' | 'progress' | 'skeleton';
  size?: 'small' | 'large';
  color?: string;
  showPercentage?: boolean;
  onComplete?: () => void;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  visible,
  message,
  progress = 0,
  type = 'spinner',
  size = 'large',
  color = '#007AFF',
  showPercentage = true,
  onComplete,
}) => {
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (visible) {
      fadeIn();
    } else {
      fadeOut();
    }
  }, [visible]);

  useEffect(() => {
    if (progress !== undefined) {
      animateProgress(progress);
    }
  }, [progress]);

  const fadeIn = () => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animateProgress = (newProgress: number) => {
    setCurrentProgress(newProgress);
    Animated.timing(progressAnimation, {
      toValue: newProgress,
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      if (newProgress >= 100 && onComplete) {
        setTimeout(onComplete, 500);
      }
    });
  };

  const renderSpinner = () => (
    <ActivityIndicator 
      size={size} 
      color={color} 
      style={styles.spinner}
    />
  );

  const renderProgress = () => {
    const width = progressAnimation.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { width, backgroundColor: color }
            ]} 
          />
        </View>
        {showPercentage && (
          <Text style={styles.progressText}>
            {Math.round(currentProgress)}%
          </Text>
        )}
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '70%' }]} />
      <View style={[styles.skeletonLine, { width: '50%' }]} />
    </View>
  );

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnimation }
      ]}
    >
      <View style={styles.content}>
        {type === 'spinner' && renderSpinner()}
        {type === 'progress' && renderProgress()}
        {type === 'skeleton' && renderSkeleton()}
        
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  spinner: {
    marginBottom: 16,
  },
  progressContainer: {
    width: 200,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  skeletonContainer: {
    width: 200,
    alignItems: 'center',
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 8,
    width: '100%',
  },
});

export default LoadingIndicator; 