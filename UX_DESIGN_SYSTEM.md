/**
 * Author: Gailad Chesa
 * Created: 2025-07-28
 * Description: UX_DESIGN_SYSTEM - handles application functionality
 */

# PacheduConnect UX Design System

## Table of Contents
1. [Current UI Components](#1-current-ui-components)
2. [Component Layouts](#2-component-layouts)
3. [Current Color Palette](#3-current-color-palette)
4. [Typography](#4-typography)
5. [UI Patterns and Interactions](#5-ui-patterns-and-interactions)
6. [Breakpoints and Responsiveness](#6-breakpoints-and-responsiveness)
7. [File and Component References](#7-file-and-component-references)

---

## 1. Current UI Components

### **Buttons**
```json
{
  "Button": {
    "location": "frontend/src/components/Button.tsx",
    "variants": {
      "primary": "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-lg hover:shadow-xl",
      "secondary": "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
      "outline": "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
      "ghost": "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500",
      "danger": "bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-500 shadow-lg hover:shadow-xl"
    },
    "sizes": {
      "sm": "px-4 py-2 text-sm",
      "md": "px-6 py-3 text-base", 
      "lg": "px-8 py-4 text-lg"
    },
    "features": ["loading states", "icon support", "full-width option", "framer-motion animations"]
  }
}
```

### **Loading Components**
```json
{
  "LoadingSpinner": {
    "location": "frontend/src/components/LoadingSpinner.tsx",
    "sizes": ["sm", "md", "lg"],
    "colors": ["primary", "white", "blue"],
    "features": ["smooth rotation", "spring animations", "optional text display"]
  },
  "LoadingOverlay": {
    "location": "frontend/src/components/LoadingOverlay.tsx",
    "features": ["overlay background", "centered spinner", "customizable message"]
  }
}
```

### **Form Components**
```json
{
  "FormInput": {
    "features": ["floating labels", "focus states", "validation indicators", "icon support"],
    "styling": "border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
  },
  "FileUpload": {
    "location": "frontend/src/components/KYCUpload.tsx",
    "features": ["drag-and-drop", "file preview", "progress indicators", "validation"]
  }
}
```

### **Notification System**
```json
{
  "Notification": {
    "location": "frontend/src/components/Notification.tsx",
    "types": ["success", "error", "warning", "info"],
    "features": ["slide-in animations", "auto-dismiss", "icon animations", "spring transitions"]
  }
}
```

### **Chat Components**
```json
{
  "ChatBot": {
    "location": "frontend/src/components/ChatBot.tsx",
    "features": ["real-time messaging", "typing indicators", "message bubbles", "toggle functionality"]
  }
}
```

### **Payment Components**
```json
{
  "PaymentProcessor": {
    "location": "frontend/src/components/PaymentProcessor.tsx",
    "features": ["gateway selection", "card input", "bank transfer", "secure processing"]
  },
  "CurrencyConverter": {
    "location": "frontend/src/components/CurrencyConverter.tsx",
    "features": ["real-time rates", "fee calculation", "country selection", "live updates"]
  }
}
```

### **KYC Components**
```json
{
  "KYCUpload": {
    "location": "frontend/src/components/KYCUpload.tsx",
    "features": ["document upload", "level-based requirements", "validation", "progress tracking"]
  },
  "KYCUploadEnhanced": {
    "location": "frontend/src/components/KYCUploadEnhanced.tsx",
    "features": ["enhanced file handling", "preview functionality", "error recovery"]
  },
  "KYCStatus": {
    "location": "frontend/src/components/KYCStatus.tsx",
    "features": ["status display", "limit tracking", "upgrade prompts"]
  }
}
```

---

## 2. Component Layouts

### **Grid System**
```json
{
  "responsive_grid": {
    "mobile": "grid-cols-1",
    "tablet": "lg:grid-cols-2",
    "desktop": "lg:grid-cols-12",
    "gap": "gap-8"
  },
  "flexbox_patterns": {
    "header": "flex justify-between items-center",
    "card": "flex flex-col space-y-4",
    "form": "flex flex-col space-y-6",
    "button_group": "flex space-x-3"
  }
}
```

### **Spacing System**
```json
{
  "spacing": {
    "xs": "0.5rem (8px)",
    "sm": "1rem (16px)", 
    "md": "1.5rem (24px)",
    "lg": "2rem (32px)",
    "xl": "3rem (48px)",
    "custom": {
      "18": "4.5rem",
      "88": "22rem", 
      "128": "32rem"
    }
  }
}
```

### **Card Layouts**
```json
{
  "card_patterns": {
    "basic": "bg-white rounded-lg shadow-soft p-6",
    "interactive": "bg-white rounded-lg shadow-soft p-6 hover:shadow-medium transition-shadow",
    "featured": "bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-medium p-8",
    "compact": "bg-white rounded-lg shadow-sm p-4"
  }
}
```

---

## 3. Current Color Palette

### **Primary Colors**
```json
{
  "primary": {
    "50": "#f0f9ff",
    "100": "#e0f2fe", 
    "200": "#bae6fd",
    "300": "#7dd3fc",
    "400": "#38bdf8",
    "500": "#0ea5e9",
    "600": "#0284c7",
    "700": "#0369a1",
    "800": "#075985",
    "900": "#0c4a6e",
    "950": "#082f49"
  },
  "secondary": {
    "50": "#f8fafc",
    "100": "#f1f5f9",
    "200": "#e2e8f0", 
    "300": "#cbd5e1",
    "400": "#94a3b8",
    "500": "#64748b",
    "600": "#475569",
    "700": "#334155",
    "800": "#1e293b",
    "900": "#0f172a",
    "950": "#020617"
  }
}
```

### **Semantic Colors**
```json
{
  "success": {
    "50": "#f0fdf4",
    "100": "#dcfce7",
    "200": "#bbf7d0",
    "300": "#86efac",
    "400": "#4ade80",
    "500": "#22c55e",
    "600": "#16a34a",
    "700": "#15803d",
    "800": "#166534",
    "900": "#14532d",
    "950": "#052e16"
  },
  "warning": {
    "50": "#fffbeb",
    "100": "#fef3c7",
    "200": "#fde68a",
    "300": "#fcd34d",
    "400": "#fbbf24",
    "500": "#f59e0b",
    "600": "#d97706",
    "700": "#b45309",
    "800": "#92400e",
    "900": "#78350f",
    "950": "#451a03"
  },
  "error": {
    "50": "#fef2f2",
    "100": "#fee2e2",
    "200": "#fecaca",
    "300": "#fca5a5",
    "400": "#f87171",
    "500": "#ef4444",
    "600": "#dc2626",
    "700": "#b91c1c",
    "800": "#991b1b",
    "900": "#7f1d1d",
    "950": "#450a0a"
  }
}
```

### **Regional Colors**
```json
{
  "zimbabwe": {
    "green": "#009639",
    "yellow": "#FFD700", 
    "red": "#CE1126",
    "black": "#000000"
  },
  "southafrica": {
    "green": "#007A4D",
    "yellow": "#FFB81C",
    "red": "#DE3831", 
    "blue": "#002395",
    "black": "#000000",
    "white": "#FFFFFF"
  }
}
```

### **Gradient Combinations**
```json
{
  "gradients": {
    "primary": "from-blue-600 to-purple-600",
    "secondary": "from-purple-600 to-pink-600",
    "success": "from-green-500 to-emerald-500",
    "danger": "from-red-600 to-pink-600",
    "background": "from-blue-50 via-white to-blue-50"
  }
}
```

---

## 4. Typography

### **Font Families**
```json
{
  "fonts": {
    "sans": ["Inter", "system-ui", "sans-serif"],
    "display": ["Poppins", "system-ui", "sans-serif"],
    "mono": ["JetBrains Mono", "monospace"]
  }
}
```

### **Font Sizes**
```json
{
  "font_sizes": {
    "xs": ["0.75rem", { "lineHeight": "1rem" }],
    "sm": ["0.875rem", { "lineHeight": "1.25rem" }],
    "base": ["1rem", { "lineHeight": "1.5rem" }],
    "lg": ["1.125rem", { "lineHeight": "1.75rem" }],
    "xl": ["1.25rem", { "lineHeight": "1.75rem" }],
    "2xl": ["1.5rem", { "lineHeight": "2rem" }],
    "3xl": ["1.875rem", { "lineHeight": "2.25rem" }],
    "4xl": ["2.25rem", { "lineHeight": "2.5rem" }],
    "5xl": ["3rem", { "lineHeight": "1" }],
    "6xl": ["3.75rem", { "lineHeight": "1" }],
    "7xl": ["4.5rem", { "lineHeight": "1" }],
    "8xl": ["6rem", { "lineHeight": "1" }],
    "9xl": ["8rem", { "lineHeight": "1" }]
  }
}
```

### **Font Weights**
```json
{
  "font_weights": {
    "light": "300",
    "normal": "400",
    "medium": "500",
    "semibold": "600",
    "bold": "700",
    "extrabold": "800"
  }
}
```

### **Text Styles**
```json
{
  "text_styles": {
    "headings": {
      "h1": "text-5xl md:text-6xl lg:text-7xl font-bold",
      "h2": "text-4xl md:text-5xl lg:text-6xl font-bold",
      "h3": "text-3xl md:text-4xl font-semibold",
      "h4": "text-2xl md:text-3xl font-semibold"
    },
    "body": {
      "large": "text-lg leading-relaxed",
      "base": "text-base leading-relaxed",
      "small": "text-sm leading-relaxed"
    },
    "labels": {
      "form": "text-sm font-medium text-gray-700",
      "button": "font-semibold",
      "caption": "text-xs text-gray-500"
    }
  }
}
```

---

## 5. UI Patterns and Interactions

### **Animations**
```json
{
  "framer_motion": {
    "container_variants": {
      "hidden": { "opacity": 0, "y": 20 },
      "visible": {
        "opacity": 1,
        "y": 0,
        "transition": {
          "duration": 0.6,
          "staggerChildren": 0.1
        }
      }
    },
    "button_variants": {
      "hover": { 
        "scale": 1.02,
        "boxShadow": "0 10px 25px rgba(0, 0, 0, 0.15)"
      },
      "tap": { "scale": 0.98 }
    },
    "notification_variants": {
      "hidden": { "opacity": 0, "y": -50, "scale": 0.9, "x": "100%" },
      "visible": { 
        "opacity": 1, 
        "y": 0, 
        "scale": 1,
        "x": 0,
        "transition": {
          "type": "spring",
          "stiffness": 300,
          "damping": 30
        }
      }
    }
  },
  "custom_animations": {
    "fade-in": "fadeIn 0.5s ease-in-out",
    "slide-up": "slideUp 0.3s ease-out", 
    "slide-down": "slideDown 0.3s ease-out",
    "scale-in": "scaleIn 0.2s ease-out",
    "bounce-slow": "bounce 2s infinite",
    "pulse-slow": "pulse 3s infinite"
  }
}
```

### **Hover States**
```json
{
  "hover_effects": {
    "buttons": "scale: 1.02, shadow enhancement",
    "cards": "shadow-soft to shadow-medium",
    "links": "color transitions",
    "icons": "scale: 1.1"
  }
}
```

### **Focus States**
```json
{
  "focus_states": {
    "buttons": "focus:ring-2 focus:ring-offset-2",
    "inputs": "focus:ring-2 focus:ring-primary-500 focus:border-transparent",
    "links": "focus:outline-none focus:ring-2"
  }
}
```

### **Loading States**
```json
{
  "loading_states": {
    "spinner": "smooth rotation animation",
    "skeleton": "pulse animation for content",
    "button": "disabled state with spinner",
    "overlay": "semi-transparent overlay with centered spinner"
  }
}
```

### **Transition Effects**
```json
{
  "transitions": {
    "colors": "transition-colors duration-200",
    "shadows": "transition-shadow duration-200",
    "transforms": "transition-transform duration-200",
    "all": "transition-all duration-200"
  }
}
```

---

## 6. Breakpoints and Responsiveness

### **Tailwind Breakpoints**
```json
{
  "breakpoints": {
    "sm": "640px",
    "md": "768px", 
    "lg": "1024px",
    "xl": "1280px",
    "2xl": "1536px"
  },
  "mobile_first": true,
  "responsive_patterns": {
    "navigation": "hidden lg:flex",
    "grid": "grid-cols-1 lg:grid-cols-2",
    "text": "text-2xl lg:text-4xl",
    "spacing": "px-4 lg:px-8"
  }
}
```

### **Mobile Optimization**
```json
{
  "mobile_features": {
    "touch_targets": "minimum 44px",
    "gesture_support": "swipe and tap animations",
    "keyboard_handling": "proper input focus management",
    "viewport": "375px width (iPhone 12), 667px height"
  }
}
```

### **Responsive Patterns**
```json
{
  "responsive_patterns": {
    "hero_section": {
      "mobile": "text-4xl font-bold",
      "tablet": "text-5xl font-bold",
      "desktop": "text-7xl font-bold"
    },
    "navigation": {
      "mobile": "hamburger menu",
      "desktop": "horizontal navigation"
    },
    "forms": {
      "mobile": "single column layout",
      "desktop": "multi-column layout"
    }
  }
}
```

---

## 7. File and Component References

### **Core Components**
```json
{
  "component_files": {
    "Button": "frontend/src/components/Button.tsx",
    "LoadingSpinner": "frontend/src/components/LoadingSpinner.tsx",
    "LoadingOverlay": "frontend/src/components/LoadingOverlay.tsx",
    "Notification": "frontend/src/components/Notification.tsx",
    "ChatBot": "frontend/src/components/ChatBot.tsx",
    "KYCUpload": "frontend/src/components/KYCUpload.tsx",
    "KYCUploadEnhanced": "frontend/src/components/KYCUploadEnhanced.tsx",
    "KYCStatus": "frontend/src/components/KYCStatus.tsx",
    "PaymentProcessor": "frontend/src/components/PaymentProcessor.tsx",
    "CurrencyConverter": "frontend/src/components/CurrencyConverter.tsx",
    "NotificationBell": "frontend/src/components/NotificationBell.tsx"
  }
}
```

### **Configuration Files**
```json
{
  "config_files": {
    "tailwind_config": "frontend/tailwind.config.js",
    "global_styles": "frontend/src/app/globals.css",
    "postcss_config": "frontend/postcss.config.js",
    "next_config": "frontend/next.config.js"
  }
}
```

### **Page Components**
```json
{
  "page_files": {
    "homepage": "frontend/src/app/page.tsx",
    "auth": "frontend/src/app/auth/page.tsx",
    "dashboard": "frontend/src/app/dashboard/page.tsx",
    "send_money": "frontend/src/app/send-money/page.tsx",
    "transactions": "frontend/src/app/transactions/page.tsx",
    "beneficiaries": "frontend/src/app/beneficiaries/page.tsx",
    "kyc": "frontend/src/app/kyc/page.tsx"
  }
}
```

### **Layout Components**
```json
{
  "layout_files": {
    "root_layout": "frontend/src/app/layout.tsx",
    "navigation": "frontend/src/components/Navigation.tsx",
    "super_admin_dashboard": "frontend/src/components/SuperAdminDashboard.tsx"
  }
}
```

### **Utility Components**
```json
{
  "utility_files": {
    "api_config": "frontend/src/config/api.ts",
    "logger": "frontend/src/utils/logger.ts",
    "validation": "frontend/src/utils/validation.ts"
  }
}
```

---

## 8. Design System Principles

### **Accessibility**
```json
{
  "accessibility": {
    "color_contrast": "WCAG AA compliant ratios",
    "focus_indicators": "Clear focus rings on all interactive elements",
    "keyboard_navigation": "Full keyboard support",
    "screen_reader": "Proper ARIA labels and semantic HTML",
    "touch_targets": "Minimum 44px for mobile interactions"
  }
}
```

### **Performance**
```json
{
  "performance": {
    "animations": "60fps smooth animations",
    "lazy_loading": "Components load as needed",
    "optimized_bundles": "Efficient component structure",
    "image_optimization": "Next.js automatic image optimization"
  }
}
```

### **User Experience**
```json
{
  "user_experience": {
    "loading_states": "Visual feedback during operations",
    "error_handling": "Graceful error display and recovery",
    "success_feedback": "Positive reinforcement for actions",
    "progressive_disclosure": "Information revealed as needed"
  }
}
```

---

## 9. Implementation Guidelines

### **Component Development**
- Use TypeScript for type safety
- Implement proper prop interfaces
- Include accessibility attributes
- Add comprehensive error handling
- Test across different screen sizes

### **Styling Approach**
- Use Tailwind CSS utility classes
- Create custom components for complex patterns
- Maintain consistent spacing and typography
- Ensure responsive design principles

### **Animation Guidelines**
- Use Framer Motion for complex animations
- Keep animations subtle and purposeful
- Ensure animations don't interfere with usability
- Provide reduced motion alternatives

### **Color Usage**
- Use semantic colors for status and feedback
- Maintain sufficient contrast ratios
- Consider color blindness in design decisions
- Use gradients sparingly and purposefully

---

## 10. Future Enhancements

### **Planned Improvements**
- Dark mode support
- Advanced animation library
- Enhanced mobile interactions
- Improved accessibility features
- Performance optimizations

### **Design System Evolution**
- Component documentation with Storybook
- Design tokens for better consistency
- Automated testing for visual regression
- Design system governance process

---

*This design system serves as the foundation for creating consistent, accessible, and performant user interfaces across the PacheduConnect platform.* 