# PacheduConnect Admin Dashboard

A comprehensive admin dashboard for managing the PacheduConnect remittance platform. Built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### 📊 Dashboard Overview
- **Real-time Statistics**: Live updates of key metrics
- **Revenue Tracking**: Daily, weekly, and monthly revenue analysis
- **Transaction Monitoring**: Real-time transaction status tracking
- **User Management**: Complete user administration tools
- **KYC Management**: Document verification workflow
- **Analytics**: Advanced reporting and insights

### 👥 User Management
- **User List**: View all registered users with filtering and search
- **User Details**: Comprehensive user profiles and activity history
- **Account Status**: Suspend/activate user accounts
- **KYC Verification**: Approve/reject KYC documents
- **Role Management**: Admin and super admin role assignments

### 💰 Transaction Management
- **Transaction List**: View all transactions with advanced filtering
- **Transaction Details**: Complete transaction information and status
- **Payment Tracking**: Monitor payment gateway integrations
- **Fraud Detection**: Identify suspicious transactions
- **Refund Processing**: Handle refund requests

### 📋 KYC Management
- **Document Review**: Review uploaded KYC documents
- **Verification Workflow**: Streamlined approval process
- **Level Management**: Bronze, Silver, Gold KYC levels
- **Compliance Tracking**: Regulatory compliance monitoring
- **Audit Trail**: Complete verification history

### 📈 Analytics & Reporting
- **Revenue Analytics**: Detailed revenue breakdown and trends
- **Transaction Analytics**: Transaction volume and success rates
- **User Analytics**: User growth and engagement metrics
- **KYC Analytics**: Verification success rates and processing times
- **Export Reports**: Generate PDF and Excel reports

### ⚙️ System Administration
- **Settings Management**: Platform configuration
- **Payment Gateway Settings**: Gateway configuration and testing
- **Notification Settings**: Email and SMS notification management
- **Security Settings**: Security policy configuration
- **Backup Management**: Database backup and restore

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query for server state
- **UI Components**: Headless UI + Heroicons
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation

### Backend Integration
- **API Client**: Axios with interceptors
- **Authentication**: JWT token management
- **Real-time Updates**: WebSocket connections
- **Error Handling**: Comprehensive error management
- **Caching**: React Query caching strategies

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI components
│   │   ├── forms/          # Form components
│   │   ├── tables/         # Data table components
│   │   ├── charts/         # Chart components
│   │   └── layout/         # Layout components
│   ├── pages/              # Next.js pages
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── users/          # User management pages
│   │   ├── transactions/   # Transaction pages
│   │   ├── kyc/           # KYC management pages
│   │   ├── analytics/      # Analytics pages
│   │   └── settings/       # Settings pages
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   │   ├── api.ts         # API client
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── formatters.ts  # Data formatting utilities
│   │   └── validators.ts  # Form validation schemas
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Global styles
├── public/                 # Static assets
├── docs/                   # Documentation
└── tests/                  # Test files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running (see main README)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pacheduconnect/pacheduconnect.git
   cd pacheduconnect/admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3001
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the dashboard**
   - Open http://localhost:3001
   - Login with admin credentials

### Docker Setup

1. **Build the image**
   ```bash
   docker build -t pachedu-admin-dashboard .
   ```

2. **Run the container**
   ```bash
   docker run -p 3001:3000 pachedu-admin-dashboard
   ```

## 📊 Dashboard Features

### Main Dashboard
- **Overview Cards**: Key metrics at a glance
- **Revenue Charts**: Visual revenue trends
- **Recent Activity**: Latest system activities
- **Quick Actions**: Common admin tasks

### User Management
- **User List**: Searchable and filterable user table
- **User Details**: Complete user information
- **KYC Status**: Document verification status
- **Account Actions**: Suspend/activate accounts

### Transaction Management
- **Transaction List**: All transactions with filters
- **Transaction Details**: Complete transaction info
- **Payment Status**: Real-time payment tracking
- **Refund Processing**: Handle refund requests

### KYC Management
- **Document Review**: Review uploaded documents
- **Approval Workflow**: Streamlined verification process
- **Level Management**: KYC level assignments
- **Compliance Tracking**: Regulatory compliance

### Analytics
- **Revenue Analytics**: Revenue trends and breakdown
- **Transaction Analytics**: Volume and success rates
- **User Analytics**: Growth and engagement metrics
- **KYC Analytics**: Verification metrics

### Settings
- **Platform Settings**: General configuration
- **Payment Settings**: Gateway configuration
- **Notification Settings**: Email/SMS configuration
- **Security Settings**: Security policies

## 🔐 Authentication & Authorization

### Admin Roles
- **Admin**: Basic administrative access
- **Super Admin**: Full system access

### Permissions
- **User Management**: View, edit, suspend users
- **Transaction Management**: View, update transactions
- **KYC Management**: Approve/reject documents
- **Analytics**: View reports and analytics
- **Settings**: Configure system settings

### Security Features
- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Permission-based access control
- **Session Management**: Secure session handling
- **Audit Logging**: Complete action logging

## 📈 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js image optimization
- **Caching**: React Query caching strategies
- **Bundle Optimization**: Tree shaking and minification

### Backend Integration
- **API Caching**: Intelligent API response caching
- **Real-time Updates**: WebSocket for live data
- **Error Handling**: Graceful error management
- **Loading States**: Smooth loading experiences

## 🧪 Testing

### Test Types
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API integration testing
- **E2E Tests**: Complete user workflow testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
# Production
NEXT_PUBLIC_API_URL=https://api.pacheduconnect.com
NEXT_PUBLIC_ADMIN_URL=https://admin.pacheduconnect.com
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://admin.pacheduconnect.com
```

### Docker Deployment
```bash
# Build production image
docker build -t pachedu-admin-dashboard:prod .

# Run with environment variables
docker run -p 3001:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.pacheduconnect.com \
  -e NEXTAUTH_SECRET=your-secret \
  pachedu-admin-dashboard:prod
```

## 🔧 Development

### Code Style
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Type safety and IntelliSense

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

### Adding New Features
1. **Create components** in `src/components/`
2. **Add pages** in `src/pages/`
3. **Update types** in `src/types/`
4. **Add API methods** in `src/utils/api.ts`
5. **Write tests** in `tests/`

## 📚 Documentation

### API Documentation
- **OpenAPI Spec**: Interactive API documentation
- **Type Definitions**: Complete TypeScript types
- **Error Handling**: Comprehensive error documentation

### Component Documentation
- **Storybook**: Component library and examples
- **Props Documentation**: Detailed prop descriptions
- **Usage Examples**: Real-world usage examples

## 🤝 Contributing

### Development Workflow
1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Write tests**
5. **Submit a pull request**

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting
- **Testing**: Comprehensive test coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Comprehensive guides and examples
- **GitHub Issues**: Bug reports and feature requests
- **Email Support**: admin-support@pacheduconnect.com

### Common Issues
- **Authentication**: Check JWT token and permissions
- **API Errors**: Verify API endpoint configuration
- **Build Issues**: Check Node.js version and dependencies
- **Deployment**: Verify environment variables and Docker setup 