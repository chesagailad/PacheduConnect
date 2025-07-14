# PacheduConnect - Cross-Border Remittance Platform

A comprehensive, secure, and user-friendly cross-border remittance platform designed for Zimbabwean expatriates living in South Africa. The platform provides seamless money transfer services with advanced KYC verification, real-time tracking, and multiple delivery options.

## 🌟 Project Scope

### Core Platform Features
- **Multi-Platform Access**: Web application, mobile apps (iOS/Android), and chatbot integrations
- **Advanced KYC System**: Three-tier verification (Bronze, Silver, Gold) with document upload and admin approval
- **Real-time Money Transfers**: Secure transaction processing with multiple payment gateways
- **Multiple Delivery Options**: EcoCash, bank transfers, USD cash pickup, and home delivery
- **Live Tracking**: Real-time transaction status with SMS/WhatsApp notifications
- **Admin & Super Admin Panels**: Comprehensive management dashboards with analytics
- **Security & Compliance**: PCI-DSS compliant with AES-256 encryption and audit logging

### User Experience Features
- **Modern UI/UX**: Beautiful, responsive design with microinteractions and animations
- **Real-time Calculator**: Live exchange rates, fee calculations, and delivery time estimates
- **Country Selection**: Smart country dropdown with localized content
- **Progress Indicators**: Visual feedback for all user actions
- **Notification System**: Real-time alerts and status updates
- **Mobile-First Design**: Optimized for all devices and screen sizes

### Business Intelligence
- **Analytics Dashboard**: Transaction metrics, user activity, and revenue tracking
- **Fraud Detection**: AI-powered transaction monitoring and risk assessment
- **KYC Management**: Document verification workflows and approval processes
- **User Management**: Comprehensive user administration and support tools

## 🏗️ Tech Stack

### Frontend Technologies
- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS with custom design system
- **Animations**: Framer Motion for smooth microinteractions
- **State Management**: React hooks and context API
- **Form Handling**: React Hook Form with validation
- **UI Components**: Custom component library with accessibility features
- **Real-time Updates**: WebSocket integration for live data

### Backend Technologies
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Caching**: Redis for session management and caching
- **Authentication**: JWT tokens with refresh mechanism
- **File Upload**: Multer with cloud storage integration
- **SMS Service**: SMSPortal integration with OAuth 2.0
- **Email Service**: Nodemailer with template system

### Security & Compliance
- **Encryption**: AES-256-GCM for sensitive data
- **PCI-DSS Compliance**: Secure payment processing
- **Audit Logging**: Comprehensive activity tracking
- **Input Validation**: Sanitization and validation middleware
- **Rate Limiting**: Protection against abuse
- **CORS**: Cross-origin resource sharing configuration

### Database & Storage
- **Primary Database**: PostgreSQL with optimized schemas
- **File Storage**: Local file system with backup strategy
- **Session Storage**: Redis for fast session management
- **Data Migration**: Automated database synchronization

### Development Tools
- **Package Manager**: npm with workspace configuration
- **Development Server**: Nodemon for backend, Next.js dev server
- **Code Quality**: ESLint, Prettier for code formatting
- **Testing**: Jest and Supertest for API testing
- **Environment Management**: dotenv for configuration

### Deployment & Infrastructure
- **Containerization**: Docker with docker-compose
- **Process Management**: PM2 for production deployment
- **Logging**: Winston with structured logging
- **Monitoring**: Health checks and performance metrics
- **Error Handling**: Global error middleware with detailed logging

## 📱 Platform Access

### Web Application
- **URL**: http://localhost:3000 (development)
- **Features**: Responsive design, real-time updates, modern UI
- **Authentication**: JWT-based with secure session management
- **Performance**: Optimized for low-bandwidth connections

### Mobile Applications
- **Framework**: React Native (planned)
- **Features**: Offline functionality, biometric authentication
- **Platforms**: iOS and Android with native performance

### Chatbot Integrations
- **WhatsApp Bot**: Conversational interface for basic services
- **Telegram Bot**: Lightweight bot for tech-savvy users
- **AI Integration**: Natural language processing for user queries

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+)
- Redis (v6+)
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pacheduconnect.git
cd pacheduconnect
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

3. **Environment Setup**
```bash
# Copy environment template
cp env.example .env

# Configure your environment variables:
# - Database connection
# - Redis connection
# - SMSPortal credentials
# - JWT secrets
# - Encryption keys
```

4. **Database Setup**
```bash
# Start PostgreSQL and Redis
brew services start postgresql@15
brew services start redis

# Run database migrations
cd backend && npm run db:reset
```

5. **Start Development Servers**
```bash
# Start both backend and frontend
npm run dev

# Or start individually:
# Backend (port 5001)
cd backend && npm run dev

# Frontend (port 3000)
cd frontend && npm run dev
```

## 📁 Project Structure

```
PacheduConnect/
├── backend/                 # API Server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/         # Database models (User, KYC, Transaction, etc.)
│   │   ├── routes/         # API routes (auth, kyc, payments, etc.)
│   │   ├── services/       # Business logic (SMS, payments, etc.)
│   │   ├── middleware/     # Custom middleware (auth, security, etc.)
│   │   └── utils/          # Helper functions (encryption, logging, etc.)
│   ├── scripts/            # Database and utility scripts
│   └── tests/              # API tests
├── frontend/               # Next.js Web Application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API integration services
│   │   └── utils/        # Helper functions
│   └── public/           # Static assets
├── mobile/               # React Native App (planned)
├── chatbots/            # WhatsApp & Telegram Bots (planned)
├── admin-dashboard/     # Admin Panel (integrated)
├── docs/               # Documentation
└── deployment/         # Docker & CI/CD configuration
```

## 🔧 Key Integrations

### Payment Processing
- **Multiple Gateways**: Support for various payment processors
- **Secure Processing**: PCI-DSS compliant transaction handling
- **Real-time Validation**: Transaction limits and fraud detection

### Communication Services
- **SMSPortal**: OAuth 2.0 integration for SMS delivery
- **WhatsApp API**: Business messaging integration (planned)
- **Email Service**: Transactional email notifications

### Security Features
- **AES-256 Encryption**: For sensitive data storage
- **JWT Authentication**: Secure session management
- **Audit Logging**: Comprehensive activity tracking
- **Input Validation**: Protection against malicious input

## 📊 Current Features

### ✅ Implemented
- **User Authentication**: Registration, login, password reset with OTP
- **KYC System**: Three-tier verification with document upload
- **Admin Dashboard**: User management, KYC approval workflows
- **Super Admin**: System-wide management and analytics
- **SMS Integration**: SMSPortal OAuth 2.0 with live delivery
- **Security**: AES-256 encryption, audit logging, PCI-DSS compliance
- **Modern UI**: Beautiful homepage with real-time calculator
- **Database**: PostgreSQL with optimized schemas and relationships

### 🚧 In Development
- **Payment Gateways**: Ozow, Stitch, PayFast integration
- **Mobile Apps**: React Native iOS/Android applications
- **Chatbots**: WhatsApp and Telegram bot implementations
- **Real-time Tracking**: WebSocket integration for live updates

### 📋 Planned Features
- **AI/ML Integration**: OCR for KYC, NLP for support
- **Advanced Analytics**: Business intelligence and reporting
- **Multi-language Support**: Localization for different regions
- **Advanced Security**: Biometric authentication, 2FA

## 🔒 Security & Compliance

- **PCI-DSS Compliance**: Secure payment processing standards
- **AES-256 Encryption**: Military-grade data protection
- **Audit Logging**: Comprehensive activity tracking
- **Input Validation**: Protection against injection attacks
- **Rate Limiting**: Protection against abuse and DDoS
- **Secure Headers**: Protection against common vulnerabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@pacheduconnect.com
- **Documentation**: [docs.pacheduconnect.com](https://docs.pacheduconnect.com)
- **Issues**: GitHub Issues for bug reports and feature requests

---

**Built with ❤️ for the Zimbabwean diaspora community**

*Empowering secure, fast, and reliable cross-border remittances* 