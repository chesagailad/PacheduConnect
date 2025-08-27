'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  // High contrast mode
  highContrast: boolean;
  toggleHighContrast: () => void;
  
  // Font size
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  
  // Reduced motion
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  
  // Focus indicators
  showFocusIndicators: boolean;
  toggleFocusIndicators: () => void;
  
  // Screen reader announcements
  announceToScreenReader: (message: string) => void;
  
  // Keyboard navigation
  enableKeyboardNavigation: boolean;
  toggleKeyboardNavigation: () => void;
  
  // Color blind friendly mode
  colorBlindFriendly: boolean;
  toggleColorBlindFriendly: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showFocusIndicators, setShowFocusIndicators] = useState(true);
  const [enableKeyboardNavigation, setEnableKeyboardNavigation] = useState(true);
  const [colorBlindFriendly, setColorBlindFriendly] = useState(false);

  // Screen reader announcements
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Toggle functions
  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('accessibility-highContrast', String(newValue));
    announceToScreenReader(`High contrast mode ${newValue ? 'enabled' : 'disabled'}`);
  };

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    localStorage.setItem('accessibility-reducedMotion', String(newValue));
    announceToScreenReader(`Reduced motion ${newValue ? 'enabled' : 'disabled'}`);
  };

  const toggleFocusIndicators = () => {
    const newValue = !showFocusIndicators;
    setShowFocusIndicators(newValue);
    localStorage.setItem('accessibility-focusIndicators', String(newValue));
    announceToScreenReader(`Focus indicators ${newValue ? 'enabled' : 'disabled'}`);
  };

  const toggleKeyboardNavigation = () => {
    const newValue = !enableKeyboardNavigation;
    setEnableKeyboardNavigation(newValue);
    localStorage.setItem('accessibility-keyboardNavigation', String(newValue));
    announceToScreenReader(`Keyboard navigation ${newValue ? 'enabled' : 'disabled'}`);
  };

  const toggleColorBlindFriendly = () => {
    const newValue = !colorBlindFriendly;
    setColorBlindFriendly(newValue);
    localStorage.setItem('accessibility-colorBlindFriendly', String(newValue));
    announceToScreenReader(`Color blind friendly mode ${newValue ? 'enabled' : 'disabled'}`);
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('accessibility-highContrast');
    const savedFontSize = localStorage.getItem('accessibility-fontSize');
    const savedReducedMotion = localStorage.getItem('accessibility-reducedMotion');
    const savedFocusIndicators = localStorage.getItem('accessibility-focusIndicators');
    const savedKeyboardNavigation = localStorage.getItem('accessibility-keyboardNavigation');
    const savedColorBlindFriendly = localStorage.getItem('accessibility-colorBlindFriendly');

    if (savedHighContrast) setHighContrast(savedHighContrast === 'true');
    if (savedFontSize) setFontSize(savedFontSize as 'small' | 'medium' | 'large');
    if (savedReducedMotion) setReducedMotion(savedReducedMotion === 'true');
    if (savedFocusIndicators) setShowFocusIndicators(savedFocusIndicators === 'true');
    if (savedKeyboardNavigation) setEnableKeyboardNavigation(savedKeyboardNavigation === 'true');
    if (savedColorBlindFriendly) setColorBlindFriendly(savedColorBlindFriendly === 'true');
  }, []);

  // Apply accessibility styles to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${fontSize}`);

    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Focus indicators
    if (showFocusIndicators) {
      root.classList.add('show-focus-indicators');
    } else {
      root.classList.remove('show-focus-indicators');
    }

    // Color blind friendly
    if (colorBlindFriendly) {
      root.classList.add('color-blind-friendly');
    } else {
      root.classList.remove('color-blind-friendly');
    }

    // Save font size to localStorage
    localStorage.setItem('accessibility-fontSize', fontSize);
  }, [highContrast, fontSize, reducedMotion, showFocusIndicators, colorBlindFriendly]);

  // Keyboard navigation support
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'Tab':
          // Ensure focus indicators are visible when using keyboard
          if (!showFocusIndicators) {
            setShowFocusIndicators(true);
          }
          break;
        case 'Escape':
          // Close modals, dropdowns, etc.
          const escapeEvent = new CustomEvent('accessibility-escape');
          document.dispatchEvent(escapeEvent);
          break;
        case 'Enter':
        case ' ':
          // Handle enter/space on focusable elements
          if (event.target instanceof HTMLElement && event.target.getAttribute('role') === 'button') {
            event.preventDefault();
            event.target.click();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, showFocusIndicators]);

  const value: AccessibilityContextType = {
    highContrast,
    toggleHighContrast,
    fontSize,
    setFontSize,
    reducedMotion,
    toggleReducedMotion,
    showFocusIndicators,
    toggleFocusIndicators,
    announceToScreenReader,
    enableKeyboardNavigation,
    toggleKeyboardNavigation,
    colorBlindFriendly,
    toggleColorBlindFriendly,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityProvider; 