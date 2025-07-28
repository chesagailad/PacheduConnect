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

### Fraud Prevention System
- **Real-time Risk Assessment**: Multi-layer fraud detection algorithms
- **Device Fingerprinting**: Advanced device identification and tracking
- **Behavioral Analysis**: User behavior pattern recognition
- **Geographic Risk Analysis**: Location-based fraud detection
- **Transaction Velocity Monitoring**: Rate limiting and abuse prevention
- **Admin Fraud Dashboard**: Real-time fraud monitoring and management

## 🏗️ Tech Stack

### **Frontend Technologies**
- **Framework**: Next.js 14 with App Router and TypeScript
- **Styling**: TailwindCSS with custom design system and CSS modules
- **Animations**: Framer Motion for smooth microinteractions and transitions
- **State Management**: React hooks, Context API, and Zustand for complex state
- **Form Handling**: React Hook Form with Zod validation schemas
- **UI Components**: Custom component library with Radix UI primitives
- **Real-time Updates**: WebSocket integration with Socket.io client
- **Testing**: Jest, React Testing Library, and Playwright for E2E testing
- **Build Tools**: Vite for fast development and Webpack for production
- **Code Quality**: ESLint, Prettier, and Husky for pre-commit hooks

### **Backend Technologies**
- **Runtime**: Node.js 18+ with Express.js framework
- **Language**: TypeScript for type safety and better development experience
- **Database**: PostgreSQL 15+ with Sequelize ORM and migrations
- **Caching**: Redis 6+ for session management, caching, and real-time data
- **Authentication**: JWT tokens with refresh mechanism and OAuth 2.0
- **File Upload**: Multer with cloud storage integration (AWS S3 compatible)
- **SMS Service**: SMSPortal integration with OAuth 2.0 and webhook handling
- **Email Service**: Nodemailer with template system and queue management
- **Payment Processing**: Multiple gateway integrations (Stripe, Ozow, PayFast, Stitch)
- **API Documentation**: Swagger/OpenAPI 3.0 with automatic documentation

### **Fraud Prevention System**
- **Risk Assessment**: Multi-layer fraud detection algorithms with machine learning
- **Device Fingerprinting**: Advanced device identification using browser APIs
- **Behavioral Analysis**: User behavior pattern recognition and anomaly detection
- **Geographic Validation**: Location-based fraud detection with IP geolocation
- **Real-time Monitoring**: Live transaction screening and alert generation
- **Analytics Engine**: Redis-based analytics with real-time dashboards
- **Machine Learning**: TensorFlow.js for client-side fraud detection
- **Pattern Recognition**: Statistical analysis and predictive modeling

### **Security & Compliance**
- **Encryption**: AES-256-GCM for sensitive data with key rotation
- **PCI-DSS Compliance**: Secure payment processing with tokenization
- **Audit Logging**: Comprehensive activity tracking with Winston logger
- **Input Validation**: Sanitization and validation middleware with Joi schemas
- **Rate Limiting**: Express-rate-limit with Redis backend for distributed systems
- **CORS**: Cross-origin resource sharing with environment-specific configuration
- **Helmet.js**: Security headers and CSP (Content Security Policy)
- **SQL Injection Protection**: Parameterized queries and input sanitization
- **XSS Protection**: Content Security Policy and input validation
- **CSRF Protection**: CSRF tokens and SameSite cookie attributes

### **Database & Storage**
- **Primary Database**: PostgreSQL 15+ with optimized schemas and indexing
- **File Storage**: Local file system with backup strategy and cloud integration
- **Session Storage**: Redis for fast session management and distributed caching
- **Data Migration**: Automated database synchronization with Sequelize migrations
- **Database Optimization**: Connection pooling, query optimization, and indexing
- **Backup Strategy**: Automated backups with point-in-time recovery
- **Data Encryption**: Column-level encryption for sensitive data
- **Audit Trails**: Comprehensive logging of all database operations

### **Development Tools & DevOps**
- **Package Manager**: npm with workspace configuration and monorepo setup
- **Version Control**: Git with conventional commits and semantic versioning
- **Development Server**: Nodemon for backend, Next.js dev server for frontend
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode
- **Testing Framework**: Jest, Supertest, React Testing Library, and Playwright
- **Environment Management**: dotenv for configuration with environment validation
- **Code Coverage**: Istanbul for test coverage reporting
- **Continuous Integration**: GitHub Actions with automated testing and deployment
- **Dependency Management**: npm audit and automated security updates

### **Deployment & Infrastructure**
- **Containerization**: Docker with docker-compose for multi-service deployment
- **Process Management**: PM2 for production deployment with clustering
- **Logging**: Winston with structured logging and log aggregation
- **Monitoring**: Health checks, performance metrics, and APM integration
- **Error Handling**: Global error middleware with detailed logging and alerting
- **Load Balancing**: Nginx reverse proxy with SSL termination
- **CDN Integration**: CloudFlare for static asset delivery and DDoS protection
- **SSL/TLS**: Let's Encrypt for automatic SSL certificate management
- **Backup & Recovery**: Automated backup procedures with disaster recovery
- **Performance Monitoring**: New Relic or DataDog integration for APM

### **Payment Gateway Integrations**
- **Stripe**: Global payment processor with 3D Secure and SCA compliance
- **Ozow**: South African EFT payment processor with instant settlement
- **PayFast**: South African multi-payment processor with recurring billing
- **Stitch**: South African open banking processor with PSD2 compliance
- **Webhook Handling**: Secure webhook processing with signature verification
- **Payment Security**: PCI-DSS Level 1 compliance with tokenization
- **Fraud Prevention**: Real-time transaction screening and risk assessment

### **Communication Services**
- **SMS Integration**: SMSPortal OAuth 2.0 with delivery status tracking
- **WhatsApp Business API**: Conversational interface for customer support
- **Email Service**: Transactional emails with template system and queue management
- **Push Notifications**: Web push notifications for real-time updates
- **In-App Messaging**: Real-time chat system with message persistence
- **Notification Queues**: Redis-based queue system for reliable message delivery

### **Analytics & Business Intelligence**
- **Real-time Analytics**: Redis-based analytics with real-time dashboards
- **User Behavior Tracking**: Privacy-compliant user behavior analysis
- **Transaction Analytics**: Comprehensive transaction reporting and insights
- **Fraud Analytics**: Fraud pattern detection and risk assessment metrics
- **Performance Monitoring**: Application performance monitoring and alerting
- **Business Metrics**: Revenue tracking, user growth, and conversion analytics

### **Mobile & Progressive Web App**
- **PWA Support**: Progressive Web App with offline functionality
- **Mobile Optimization**: Responsive design with touch-friendly interfaces
- **Biometric Authentication**: Fingerprint and face ID integration
- **Offline Capabilities**: Service workers for offline functionality
- **Push Notifications**: Web push notifications for mobile-like experience
- **App-like Experience**: Native app-like interface with smooth animations

### **Testing & Quality Assurance**
- **Unit Testing**: Jest with comprehensive test coverage
- **Integration Testing**: Supertest for API endpoint testing
- **E2E Testing**: Playwright for end-to-end user journey testing
- **Visual Regression**: Automated visual testing for UI consistency
- **Performance Testing**: Load testing with Artillery or k6
- **Security Testing**: Automated security scanning with OWASP ZAP
- **Accessibility Testing**: Automated accessibility testing with axe-core

### **Monitoring & Observability**
- **Application Monitoring**: New Relic or DataDog for APM
- **Error Tracking**: Sentry for error monitoring and alerting
- **Log Aggregation**: ELK stack or similar for centralized logging
- **Health Checks**: Comprehensive health check endpoints
- **Performance Metrics**: Real-time performance monitoring
- **Uptime Monitoring**: Automated uptime monitoring and alerting
- **Business Metrics**: Custom dashboards for business KPIs

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

#### **System Requirements**
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v15.0.0 or higher
- **Redis**: v6.0.0 or higher
- **npm**: v8.0.0 or higher (or yarn v1.22.0+)
- **Git**: v2.30.0 or higher

#### **Operating System Support**
- **macOS**: 10.15+ (Catalina or later)
- **Ubuntu**: 20.04 LTS or later
- **Windows**: Windows 10/11 with WSL2 (recommended)
- **Docker**: v20.10+ (for containerized deployment)

### 🛠️ **Complete Setup Guide**

#### **Step 1: Clone and Initialize**
```bash
# Clone the repository
git clone https://github.com/yourusername/pacheduconnect.git
cd pacheduconnect

# Install root dependencies
npm install
```

#### **Step 2: Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Copy environment template
cp env.example .env

# Configure environment variables (see Environment Configuration section below)
```

#### **Step 3: Frontend Setup**
```bash
# Navigate to frontend directory
cd ../frontend

# Install frontend dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure frontend environment variables
```

#### **Step 4: Database Setup**

**PostgreSQL Installation:**
```bash
# macOS (using Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Windows (using WSL2)
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**Redis Installation:**
```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server

# Windows (using WSL2)
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

#### **Step 5: Environment Configuration**

**Backend Environment Variables** (`backend/.env`):
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pacheduconnect
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Encryption Keys
ENCRYPTION_KEY=your_32_character_encryption_key_here
ENCRYPTION_IV=your_16_character_iv_here

# SMSPortal Configuration
SMSPORTAL_CLIENT_ID=your_smsportal_client_id
SMSPORTAL_CLIENT_SECRET=your_smsportal_client_secret
SMSPORTAL_REDIRECT_URI=http://localhost:5001/api/sms/callback

# Payment Gateway Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
OZOW_API_KEY=your_ozow_api_key
OZOW_SITE_CODE=your_ozow_site_code
PAYFAST_MERCHANT_ID=your_payfast_merchant_id
PAYFAST_MERCHANT_KEY=your_payfast_merchant_key
STITCH_API_KEY=your_stitch_api_key

# Fraud Prevention Configuration
FRAUD_ENABLED=true
FRAUD_RISK_THRESHOLD=0.8
FRAUD_DAILY_LIMIT=50000
FRAUD_MAX_TRANSACTIONS=10

# Server Configuration
NODE_ENV=development
PORT=5001
CORS_ORIGIN=http://localhost:3000
```

**Frontend Environment Variables** (`frontend/.env.local`):
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Payment Gateway Keys (Public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_OZOW_SITE_CODE=your_ozow_site_code
NEXT_PUBLIC_PAYFAST_MERCHANT_ID=your_payfast_merchant_id

# Analytics (Optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# Feature Flags
NEXT_PUBLIC_FRAUD_DETECTION_ENABLED=true
NEXT_PUBLIC_CHATBOT_ENABLED=true
NEXT_PUBLIC_KYC_ENABLED=true
```

#### **Step 6: Database Initialization**
```bash
# Navigate to backend directory
cd backend

# Create database (if not exists)
createdb pacheduconnect

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Verify database connection
npm run db:check
```

#### **Step 7: Start Development Servers**

**Option 1: Start All Services (Recommended)**
```bash
# From project root
npm run dev
```

**Option 2: Start Services Individually**
```bash
# Terminal 1: Backend Server (Port 5001)
cd backend && npm run dev

# Terminal 2: Frontend Server (Port 3000)
cd frontend && npm run dev

# Terminal 3: Admin Dashboard (Port 3001)
cd admin-dashboard && npm run dev
```

#### **Step 8: Verify Installation**
```bash
# Check backend health
curl http://localhost:5001/api/health

# Check frontend
open http://localhost:3000

# Check admin dashboard
open http://localhost:3001
```

### 🔧 **Advanced Setup Options**

#### **Docker Setup (Alternative)**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### **Production Setup**
```bash
# Install PM2 globally
npm install -g pm2

# Start production servers
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs
```

### 🧪 **Testing Setup**

#### **Run All Tests**
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

#### **Test Coverage**
```bash
# Generate coverage reports
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### 🔒 **Security Setup**

#### **SSL Certificate (Production)**
```bash
# Generate SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout private.key -out certificate.crt

# Configure in environment
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
```

#### **Firewall Configuration**
```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# macOS
sudo pfctl -e
sudo pfctl -f /etc/pf.conf
```

### 📊 **Monitoring Setup**

#### **Log Aggregation**
```bash
# Install log aggregation tools
npm install -g winston-daily-rotate-file

# Configure log rotation
# See backend/src/utils/logger.js for configuration
```

#### **Performance Monitoring**
```bash
# Install monitoring tools
npm install -g pm2-web

# Start monitoring dashboard
pm2-web
```

### 🚀 **Deployment Checklist**

#### **Pre-Deployment**
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring tools installed
- [ ] Backup procedures configured

#### **Post-Deployment**
- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] Database connections stable
- [ ] Payment gateways configured
- [ ] SMS service operational
- [ ] Fraud detection active
- [ ] Admin access verified

### 🆘 **Troubleshooting**

#### **Common Issues**

**Database Connection Error:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connection
psql -h localhost -U postgres -d pacheduconnect
```

**Redis Connection Error:**
```bash
# Check Redis status
sudo systemctl status redis-server

# Restart Redis
sudo systemctl restart redis-server

# Test connection
redis-cli ping
```

**Port Already in Use:**
```bash
# Find process using port
lsof -i :5001
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Permission Denied:**
```bash
# Fix file permissions
chmod +x scripts/*.sh
chmod 755 backend/uploads/
chmod 755 frontend/public/
```

### 📚 **Additional Resources**

- **API Documentation**: `/docs/api.md`
- **Fraud Prevention System**: `/FRAUD_PREVENTION_SYSTEM.md`
- **Deployment Guide**: `/docs/deployment.md`
- **Security Guide**: `/docs/security.md`
- **Contributing Guide**: `/CONTRIBUTING.md`

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
- **Fraud Prevention**: Real-time transaction monitoring and risk assessment
- **Device Fingerprinting**: Advanced device identification and tracking
- **Behavioral Analysis**: User behavior pattern recognition
- **Geographic Risk Analysis**: Location-based fraud detection

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
- **Fraud Prevention System**: Real-time fraud detection and prevention
- **Payment Processing**: Multi-gateway payment integration
- **Real-time Monitoring**: Live transaction tracking and alerts

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