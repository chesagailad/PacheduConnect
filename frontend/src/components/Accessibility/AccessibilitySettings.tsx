'use client';

import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityProvider';

export interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const {
    highContrast,
    toggleHighContrast,
    fontSize,
    setFontSize,
    reducedMotion,
    toggleReducedMotion,
    showFocusIndicators,
    toggleFocusIndicators,
    enableKeyboardNavigation,
    toggleKeyboardNavigation,
    colorBlindFriendly,
    toggleColorBlindFriendly,
    announceToScreenReader,
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'visual' | 'navigation' | 'about'>('visual');

  if (!isOpen) return null;

  const handleClose = () => {
    announceToScreenReader('Accessibility settings closed');
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-settings-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2
            id="accessibility-settings-title"
            className="text-lg font-semibold text-gray-900 flex items-center"
          >
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Accessibility Settings
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            aria-label="Close accessibility settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'visual'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-selected={activeTab === 'visual'}
            role="tab"
          >
            Visual
          </button>
          <button
            onClick={() => setActiveTab('navigation')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'navigation'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-selected={activeTab === 'navigation'}
            role="tab"
          >
            Navigation
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'about'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-selected={activeTab === 'about'}
            role="tab"
          >
            About
          </button>
        </div>

        {/* Content */}
        <div className="p-4" role="tabpanel">
          {activeTab === 'visual' && (
            <div className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="high-contrast" className="text-sm font-medium text-gray-900">
                    High Contrast
                  </label>
                  <p className="text-xs text-gray-500">Increase contrast for better visibility</p>
                </div>
                <button
                  id="high-contrast"
                  onClick={toggleHighContrast}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    highContrast ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={highContrast}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-sm font-medium text-gray-900">Font Size</label>
                <div className="mt-2 space-y-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <label key={size} className="flex items-center">
                      <input
                        type="radio"
                        name="font-size"
                        value={size}
                        checked={fontSize === size}
                        onChange={() => setFontSize(size)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="reduced-motion" className="text-sm font-medium text-gray-900">
                    Reduced Motion
                  </label>
                  <p className="text-xs text-gray-500">Reduce animations and transitions</p>
                </div>
                <button
                  id="reduced-motion"
                  onClick={toggleReducedMotion}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={reducedMotion}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Color Blind Friendly */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="color-blind-friendly" className="text-sm font-medium text-gray-900">
                    Color Blind Friendly
                  </label>
                  <p className="text-xs text-gray-500">Use patterns and symbols instead of colors</p>
                </div>
                <button
                  id="color-blind-friendly"
                  onClick={toggleColorBlindFriendly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    colorBlindFriendly ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={colorBlindFriendly}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      colorBlindFriendly ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'navigation' && (
            <div className="space-y-4">
              {/* Focus Indicators */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="focus-indicators" className="text-sm font-medium text-gray-900">
                    Focus Indicators
                  </label>
                  <p className="text-xs text-gray-500">Show visual focus indicators</p>
                </div>
                <button
                  id="focus-indicators"
                  onClick={toggleFocusIndicators}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showFocusIndicators ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={showFocusIndicators}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showFocusIndicators ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Keyboard Navigation */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="keyboard-navigation" className="text-sm font-medium text-gray-900">
                    Enhanced Keyboard Navigation
                  </label>
                  <p className="text-xs text-gray-500">Enable additional keyboard shortcuts</p>
                </div>
                <button
                  id="keyboard-navigation"
                  onClick={toggleKeyboardNavigation}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableKeyboardNavigation ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={enableKeyboardNavigation}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableKeyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Keyboard Shortcuts</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Tab</span>
                    <span>Navigate between elements</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enter / Space</span>
                    <span>Activate buttons</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Escape</span>
                    <span>Close modals and menus</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Accessibility Commitment</h4>
                <p className="text-xs text-blue-800">
                  We are committed to making our platform accessible to all users. Our goal is to meet WCAG 2.1 AA standards and provide an inclusive experience for everyone.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Features</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Screen reader compatibility</li>
                  <li>• Keyboard navigation support</li>
                  <li>• High contrast mode</li>
                  <li>• Adjustable font sizes</li>
                  <li>• Reduced motion options</li>
                  <li>• Color blind friendly mode</li>
                </ul>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 mb-2">Need Help?</h4>
                <p className="text-xs text-green-800 mb-2">
                  If you encounter any accessibility issues, please contact our support team.
                </p>
                <button className="text-xs text-green-600 hover:text-green-800 underline">
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings; 