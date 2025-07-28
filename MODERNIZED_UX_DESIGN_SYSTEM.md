/**
 * Author: Gailad Chesa
 * Created: 2025-07-28
 * Description: MODERNIZED_UX_DESIGN_SYSTEM - handles application functionality
 */

# PacheduConnect Modernized UX Design System

## 🎨 **Design Philosophy**
*Modern, accessible, and intuitive financial technology platform that builds trust through clarity, consistency, and inclusive design.*

---

## 📋 **Table of Contents**
1. [Enhanced Color Palette](#1-enhanced-color-palette)
2. [Modernized Typography](#2-modernized-typography)
3. [Component Design System](#3-component-design-system)
4. [Layout & Spacing](#4-layout--spacing)
5. [Interactive States & Animations](#5-interactive-states--animations)
6. [Accessibility Standards](#6-accessibility-standards)
7. [Responsive Design](#7-responsive-design)
8. [Implementation Guidelines](#8-implementation-guidelines)

---

## 1. Enhanced Color Palette

### **Primary Colors**
```css
/* Modern Blue Gradient System */
--primary-50: #EFF6FF;   /* Lightest blue background */
--primary-100: #DBEAFE;  /* Light blue backgrounds */
--primary-200: #BFDBFE;  /* Subtle blue accents */
--primary-300: #93C5FD;  /* Interactive elements */
--primary-400: #60A5FA;  /* Hover states */
--primary-500: #3B82F6;  /* Primary brand color */
--primary-600: #2563EB;  /* Primary buttons */
--primary-700: #1D4ED8;  /* Active states */
--primary-800: #1E40AF;  /* Dark text on light */
--primary-900: #1E3A8A;  /* Darkest blue */
--primary-950: #172554;  /* Dark mode text */
```

### **Secondary Colors**
```css
/* Purple Accent System */
--secondary-50: #FAF5FF;
--secondary-100: #F3E8FF;
--secondary-200: #E9D5FF;
--secondary-300: #D8B4FE;
--secondary-400: #C084FC;
--secondary-500: #A855F7;  /* Secondary brand */
--secondary-600: #9333EA;
--secondary-700: #7C3AED;
--secondary-800: #6B21A8;
--secondary-900: #581C87;
--secondary-950: #3B0764;
```

### **Semantic Colors**
```css
/* Success States */
--success-50: #F0FDF4;
--success-100: #DCFCE7;
--success-500: #22C55E;  /* Success actions */
--success-600: #16A34A;
--success-700: #15803D;

/* Warning States */
--warning-50: #FFFBEB;
--warning-100: #FEF3C7;
--warning-500: #F59E0B;  /* Warning alerts */
--warning-600: #D97706;
--warning-700: #B45309;

/* Error States */
--error-50: #FEF2F2;
--error-100: #FEE2E2;
--error-500: #EF4444;    /* Error states */
--error-600: #DC2626;
--error-700: #B91C1C;

/* Info States */
--info-50: #EFF6FF;
--info-100: #DBEAFE;
--info-500: #3B82F6;     /* Information */
--info-600: #2563EB;
--info-700: #1D4ED8;
```

### **Neutral Colors**
```css
/* Gray Scale System */
--gray-50: #F9FAFB;      /* Light backgrounds */
--gray-100: #F3F4F6;     /* Borders */
--gray-200: #E5E7EB;     /* Dividers */
--gray-300: #D1D5DB;     /* Placeholder text */
--gray-400: #9CA3AF;     /* Secondary text */
--gray-500: #6B7280;     /* Body text */
--gray-600: #4B5563;     /* Primary text */
--gray-700: #374151;     /* Headings */
--gray-800: #1F2937;     /* Dark text */
--gray-900: #111827;     /* Darkest text */
--gray-950: #030712;     /* Dark mode backgrounds */
```

### **Regional Colors**
```css
/* Zimbabwe Flag Colors */
--zimbabwe-green: #009639;
--zimbabwe-yellow: #FFD700;
--zimbabwe-red: #CE1126;
--zimbabwe-black: #000000;

/* South Africa Flag Colors */
--southafrica-green: #007A4D;
--southafrica-yellow: #FFB81C;
--southafrica-red: #DE3831;
--southafrica-blue: #002395;
--southafrica-black: #000000;
--southafrica-white: #FFFFFF;
```

---

## 2. Modernized Typography

### **Font Stack**
```css
/* Primary Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
             'Droid Sans', 'Helvetica Neue', sans-serif;

/* Display Font Stack */
font-family: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', sans-serif;

/* Monospace Font Stack */
font-family: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', 
             'Roboto Mono', 'Source Code Pro', 'Droid Sans Mono', 
             'Consolas', 'Liberation Mono', 'Courier New', monospace;
```

### **Type Scale**
```css
/* Modern Type Scale (1.25 ratio) */
--text-xs: 0.75rem;      /* 12px - Captions */
--text-sm: 0.875rem;     /* 14px - Small text */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Large body */
--text-xl: 1.25rem;      /* 20px - Subheadings */
--text-2xl: 1.5rem;      /* 24px - H3 headings */
--text-3xl: 1.875rem;    /* 30px - H2 headings */
--text-4xl: 2.25rem;     /* 36px - H1 headings */
--text-5xl: 3rem;        /* 48px - Hero headings */
--text-6xl: 3.75rem;     /* 60px - Large hero */
--text-7xl: 4.5rem;      /* 72px - Extra large */
--text-8xl: 6rem;        /* 96px - Display text */
--text-9xl: 8rem;        /* 128px - Giant display */
```

### **Line Heights**
```css
/* Optimized Line Heights */
--leading-none: 1;           /* 100% */
--leading-tight: 1.25;       /* 125% */
--leading-snug: 1.375;       /* 137.5% */
--leading-normal: 1.5;       /* 150% */
--leading-relaxed: 1.625;    /* 162.5% */
--leading-loose: 2;          /* 200% */
```

### **Font Weights**
```css
/* Font Weight Scale */
--font-thin: 100;
--font-extralight: 200;
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

---

## 3. Component Design System

### **Button Components**

#### **Primary Button**
```css
.btn-primary {
  @apply bg-gradient-to-r from-primary-600 to-primary-700 
         text-white font-semibold px-6 py-3 rounded-xl
         hover:from-primary-700 hover:to-primary-800
         focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
         active:scale-95 transition-all duration-200
         shadow-lg hover:shadow-xl
         disabled:opacity-50 disabled:cursor-not-allowed;
}
```

#### **Secondary Button**
```css
.btn-secondary {
  @apply bg-white text-primary-600 border-2 border-primary-600
         font-semibold px-6 py-3 rounded-xl
         hover:bg-primary-50 hover:border-primary-700
         focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
         active:scale-95 transition-all duration-200
         shadow-sm hover:shadow-md
         disabled:opacity-50 disabled:cursor-not-allowed;
}
```

#### **Ghost Button**
```css
.btn-ghost {
  @apply text-gray-600 font-medium px-6 py-3 rounded-xl
         hover:text-gray-900 hover:bg-gray-100
         focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
         active:scale-95 transition-all duration-200
         disabled:opacity-50 disabled:cursor-not-allowed;
}
```

#### **Danger Button**
```css
.btn-danger {
  @apply bg-gradient-to-r from-error-600 to-error-700
         text-white font-semibold px-6 py-3 rounded-xl
         hover:from-error-700 hover:to-error-800
         focus:ring-2 focus:ring-error-500 focus:ring-offset-2
         active:scale-95 transition-all duration-200
         shadow-lg hover:shadow-xl
         disabled:opacity-50 disabled:cursor-not-allowed;
}
```

### **Form Components**

#### **Input Field**
```css
.input-field {
  @apply w-full px-4 py-3 border border-gray-300 rounded-xl
         focus:ring-2 focus:ring-primary-500 focus:border-transparent
         placeholder:text-gray-400 placeholder:font-normal
         transition-all duration-200
         disabled:bg-gray-50 disabled:cursor-not-allowed
         error:border-error-300 error:focus:ring-error-500;
}
```

#### **Textarea**
```css
.textarea-field {
  @apply w-full px-4 py-3 border border-gray-300 rounded-xl
         focus:ring-2 focus:ring-primary-500 focus:border-transparent
         placeholder:text-gray-400 placeholder:font-normal
         resize-vertical min-h-[120px]
         transition-all duration-200
         disabled:bg-gray-50 disabled:cursor-not-allowed;
}
```

#### **Select Dropdown**
```css
.select-field {
  @apply w-full px-4 py-3 border border-gray-300 rounded-xl
         focus:ring-2 focus:ring-primary-500 focus:border-transparent
         bg-white appearance-none
         transition-all duration-200
         disabled:bg-gray-50 disabled:cursor-not-allowed;
}
```

### **Card Components**

#### **Primary Card**
```css
.card-primary {
  @apply bg-white rounded-2xl shadow-soft border border-gray-100
         hover:shadow-medium transition-all duration-300
         focus-within:ring-2 focus-within:ring-primary-500;
}
```

#### **Interactive Card**
```css
.card-interactive {
  @apply bg-white rounded-2xl shadow-soft border border-gray-100
         hover:shadow-medium hover:scale-[1.02]
         active:scale-[0.98] transition-all duration-300
         cursor-pointer focus:ring-2 focus:ring-primary-500;
}
```

#### **Glass Card**
```css
.card-glass {
  @apply bg-white/80 backdrop-blur-sm rounded-2xl
         border border-white/20 shadow-soft
         hover:bg-white/90 transition-all duration-300;
}
```

### **Modal Components**

#### **Modal Overlay**
```css
.modal-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm
         flex items-center justify-center p-4 z-50
         animate-fade-in;
}
```

#### **Modal Content**
```css
.modal-content {
  @apply bg-white rounded-2xl shadow-strong max-w-md w-full
         max-h-[90vh] overflow-y-auto
         animate-scale-in;
}
```

### **Notification Components**

#### **Success Notification**
```css
.notification-success {
  @apply bg-success-50 border border-success-200 text-success-800
         rounded-xl p-4 shadow-soft
         animate-slide-in-right;
}
```

#### **Error Notification**
```css
.notification-error {
  @apply bg-error-50 border border-error-200 text-error-800
         rounded-xl p-4 shadow-soft
         animate-slide-in-right;
}
```

---

## 4. Layout & Spacing

### **Spacing Scale**
```css
/* 8px Base Spacing System */
--space-0: 0px;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
--space-32: 8rem;      /* 128px */
--space-40: 10rem;     /* 160px */
--space-48: 12rem;     /* 192px */
--space-56: 14rem;     /* 224px */
--space-64: 16rem;     /* 256px */
```

### **Container System**
```css
/* Responsive Container */
.container {
  @apply mx-auto px-4 sm:px-6 lg:px-8;
  max-width: 1280px; /* 7xl */
}

.container-sm {
  @apply mx-auto px-4 sm:px-6 lg:px-8;
  max-width: 640px; /* sm */
}

.container-md {
  @apply mx-auto px-4 sm:px-6 lg:px-8;
  max-width: 768px; /* md */
}

.container-lg {
  @apply mx-auto px-4 sm:px-6 lg:px-8;
  max-width: 1024px; /* lg */
}

.container-xl {
  @apply mx-auto px-4 sm:px-6 lg:px-8;
  max-width: 1280px; /* xl */
}

.container-2xl {
  @apply mx-auto px-4 sm:px-6 lg:px-8;
  max-width: 1536px; /* 2xl */
}
```

### **Grid System**
```css
/* CSS Grid Layouts */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.grid-sidebar {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
}

.grid-main-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
}
```

---

## 5. Interactive States & Animations

### **Hover States**
```css
/* Button Hover Effects */
.btn-hover-lift {
  @apply hover:scale-105 hover:shadow-lg transition-all duration-200;
}

.btn-hover-glow {
  @apply hover:shadow-glow transition-all duration-200;
}

/* Card Hover Effects */
.card-hover-lift {
  @apply hover:scale-[1.02] hover:shadow-medium transition-all duration-300;
}

.card-hover-glow {
  @apply hover:shadow-glow transition-all duration-300;
}
```

### **Focus States**
```css
/* Focus Ring System */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}

.focus-ring-white {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white;
}
```

### **Active States**
```css
/* Active Scale Effects */
.active-scale {
  @apply active:scale-95 transition-transform duration-100;
}

.active-scale-sm {
  @apply active:scale-98 transition-transform duration-100;
}
```

### **Loading States**
```css
/* Loading Spinner */
.loading-spinner {
  @apply animate-spin rounded-full border-2 border-gray-300 border-t-primary-600;
}

/* Loading Skeleton */
.skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}

.skeleton-text {
  @apply animate-pulse bg-gray-200 rounded h-4;
}

.skeleton-circle {
  @apply animate-pulse bg-gray-200 rounded-full;
}
```

### **Animation Classes**
```css
/* Fade Animations */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-fade-out {
  animation: fadeOut 0.3s ease-in;
}

/* Slide Animations */
.animate-slide-in-up {
  animation: slideInUp 0.3s ease-out;
}

.animate-slide-in-down {
  animation: slideInDown 0.3s ease-out;
}

.animate-slide-in-left {
  animation: slideInLeft 0.3s ease-out;
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

/* Scale Animations */
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

.animate-scale-out {
  animation: scaleOut 0.2s ease-in;
}
```

---

## 6. Accessibility Standards

### **WCAG 2.1 AA Compliance**

#### **Color Contrast Ratios**
```css
/* Minimum Contrast Ratios */
--contrast-normal: 4.5:1;    /* Normal text */
--contrast-large: 3:1;       /* Large text (18pt+) */
--contrast-ui: 3:1;          /* UI components */
```

#### **Focus Indicators**
```css
/* High Contrast Focus Rings */
.focus-visible {
  @apply focus-visible:outline-none focus-visible:ring-2 
         focus-visible:ring-primary-500 focus-visible:ring-offset-2;
}

/* Custom Focus for Dark Backgrounds */
.focus-visible-white {
  @apply focus-visible:outline-none focus-visible:ring-2 
         focus-visible:ring-white focus-visible:ring-offset-2 
         focus-visible:ring-offset-primary-600;
}
```

#### **Screen Reader Support**
```css
/* Screen Reader Only Text */
.sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
}

/* Skip Links */
.skip-link {
  @apply absolute -top-10 left-6 bg-primary-600 text-white px-4 py-2 rounded
         focus:top-6 transition-all duration-200 z-50;
}
```

#### **Reduced Motion Support**
```css
/* Respect User Motion Preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Responsive Design

### **Breakpoint System**
```css
/* Mobile First Breakpoints */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Medium devices */
--breakpoint-lg: 1024px;  /* Large devices */
--breakpoint-xl: 1280px;  /* Extra large devices */
--breakpoint-2xl: 1536px; /* 2X large devices */
```

### **Responsive Typography**
```css
/* Fluid Typography */
.fluid-text {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  line-height: 1.4;
}

.fluid-heading {
  font-size: clamp(1.5rem, 4vw, 3rem);
  line-height: 1.2;
}
```

### **Responsive Spacing**
```css
/* Responsive Padding */
.responsive-padding {
  @apply px-4 sm:px-6 lg:px-8 xl:px-12;
}

.responsive-margin {
  @apply mx-4 sm:mx-6 lg:mx-8 xl:mx-12;
}
```

### **Mobile Optimizations**
```css
/* Touch Targets */
.touch-target {
  @apply min-h-[44px] min-w-[44px];
}

/* Mobile Navigation */
.mobile-nav {
  @apply fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
         px-4 py-2 z-40 lg:hidden;
}
```

---

## 8. Implementation Guidelines

### **CSS Custom Properties**
```css
/* Root Variables */
:root {
  /* Colors */
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;
  --color-secondary-500: #A855F7;
  
  /* Typography */
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.5;
  
  /* Spacing */
  --spacing-base: 1rem;
  --border-radius: 0.75rem;
  
  /* Shadows */
  --shadow-soft: 0 2px 15px -3px rgba(0, 0, 0, 0.07);
  --shadow-medium: 0 4px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}
```

### **Component Architecture**
```typescript
// Example Button Component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 hover:border-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-error-600 to-error-700 text-white hover:from-error-700 hover:to-error-800 focus:ring-error-500 shadow-lg hover:shadow-xl'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};
```

### **Design Tokens**
```json
{
  "colors": {
    "primary": {
      "50": "#EFF6FF",
      "500": "#3B82F6",
      "600": "#2563EB",
      "700": "#1D4ED8"
    },
    "secondary": {
      "500": "#A855F7",
      "600": "#9333EA"
    },
    "success": {
      "500": "#22C55E",
      "600": "#16A34A"
    },
    "error": {
      "500": "#EF4444",
      "600": "#DC2626"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": ["Inter", "system-ui", "sans-serif"],
      "display": ["Poppins", "system-ui", "sans-serif"]
    },
    "fontSize": {
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem"
    },
    "fontWeight": {
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    }
  },
  "spacing": {
    "4": "1rem",
    "6": "1.5rem",
    "8": "2rem"
  },
  "borderRadius": {
    "lg": "0.5rem",
    "xl": "0.75rem",
    "2xl": "1rem"
  }
}
```

---

## 🎯 **Implementation Checklist**

### **Phase 1: Foundation**
- [ ] Update Tailwind config with new color palette
- [ ] Implement new typography system
- [ ] Create base component styles
- [ ] Set up spacing and layout utilities

### **Phase 2: Components**
- [ ] Modernize button components
- [ ] Update form input styles
- [ ] Enhance card components
- [ ] Improve modal and overlay styles

### **Phase 3: Interactions**
- [ ] Add hover and focus states
- [ ] Implement loading animations
- [ ] Create transition effects
- [ ] Add micro-interactions

### **Phase 4: Accessibility**
- [ ] Test color contrast ratios
- [ ] Implement focus indicators
- [ ] Add screen reader support
- [ ] Test keyboard navigation

### **Phase 5: Responsive**
- [ ] Optimize mobile layouts
- [ ] Test touch interactions
- [ ] Implement responsive typography
- [ ] Add mobile-specific components

---

## 📱 **Mobile-First Approach**

### **Touch Targets**
- Minimum 44px × 44px for all interactive elements
- Adequate spacing between touch targets (8px minimum)
- Clear visual feedback for touch interactions

### **Gesture Support**
- Swipe gestures for navigation
- Pull-to-refresh functionality
- Pinch-to-zoom for images
- Long-press for context menus

### **Performance**
- Optimized images and assets
- Lazy loading for components
- Efficient animations (60fps)
- Minimal bundle size

---

## 🔧 **Development Tools**

### **Design System Tools**
- Storybook for component documentation
- Chromatic for visual testing
- Figma integration for design tokens
- Automated accessibility testing

### **Quality Assurance**
- ESLint for code quality
- Prettier for code formatting
- Jest for unit testing
- Playwright for E2E testing

---

*This modernized design system provides a solid foundation for building accessible, visually appealing, and user-friendly financial applications while maintaining consistency across all platforms.* 