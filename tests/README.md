/**
 * Author: Gailad Chesa
 * Created: 2025-07-28
 * Description: README - handles application functionality
 */

# PacheduConnect End-to-End Test Suite

This directory contains comprehensive end-to-end tests for the PacheduConnect remittance platform using Playwright.

## 🎯 Test Coverage

### 1. Registration & KYC Flow (`@registration`)
- Complete user registration process
- KYC document upload and validation
- Real-time feedback for document quality
- Form validation and error handling

### 2. Login and Biometric Authentication (`@login`)
- Standard login with credentials
- Password reset flow
- Biometric authentication setup and usage
- Session management
- Offline login handling

### 3. Send Money Journey (`@send`)
- Complete money transfer flow
- Currency converter validation
- Fee breakdown calculations
- Recipient management
- Transaction limits validation
- Network error handling

### 4. Transaction History & Tracking (`@transactions`)
- Transaction list display
- Detailed transaction view
- Real-time status tracking
- Filter and search functionality
- Export capabilities
- Offline transaction history

### 5. Support and Chatbot Interaction (`@support`)
- Chatbot widget functionality
- KYC upload assistance
- Transaction tracking via chat
- Exchange rate queries
- Live agent escalation
- Multi-language support

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Basic Test Commands
```bash
# Run all tests
npm test

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests with UI mode
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Show test report
npm run test:report
```

### Targeted Test Runs
```bash
# Run specific test categories
npm run test:registration
npm run test:login
npm run test:send
npm run test:transactions
npm run test:support

# Run mobile-specific tests
npm run test:mobile

# Run desktop-specific tests
npm run test:desktop
```

### CI/CD Tests
```bash
# Run tests for CI environment
npm run test:ci
```

## 📱 Test Environments

### Desktop Browsers
- **Chromium**: Chrome-like browser
- **Firefox**: Mozilla Firefox
- **WebKit**: Safari engine

### Mobile Viewports
- **Mobile Chrome**: Pixel 5 viewport
- **Mobile Safari**: iPhone 12 viewport

## 🏗️ Test Structure

```
tests/
├── e2e/
│   ├── registration-kyc.spec.ts      # Registration & KYC tests
│   ├── login-biometric.spec.ts       # Login & biometric tests
│   ├── send-money.spec.ts            # Send money flow tests
│   ├── transaction-history.spec.ts    # Transaction tracking tests
│   └── support-chatbot.spec.ts       # Support & chatbot tests
├── fixtures/
│   ├── sample-id.jpg                 # Sample ID document
│   ├── clear-id.jpg                  # Clear ID document
│   ├── blurry-id.jpg                 # Blurry ID document
│   ├── invalid.txt                   # Invalid file type
│   └── large-file.jpg                # Large file for size testing
└── README.md                         # This documentation
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests/e2e`
- **Parallel Execution**: Enabled
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML, JSON, JUnit
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pachedu_test

# Application
NODE_ENV=test
PORT=3000
API_PORT=5001

# Test Configuration
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## 📊 Test Reports

### HTML Report
- Interactive test results
- Screenshots and videos
- Test traces
- Performance metrics

### JSON Report
- Machine-readable format
- CI/CD integration
- Custom reporting

### JUnit Report
- Standard XML format
- CI/CD compatibility
- Test summary

## 🎭 Test Data Management

### Test Users
```typescript
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  phone: '+27831234567',
  password: 'TestPassword123!'
};
```

### Test Recipients
```typescript
const recipient = {
  name: 'John Doe',
  phone: '+263771234567',
  bankAccount: '1234567890',
  bankName: 'CBZ Bank'
};
```

## 🔍 Test Assertions

### Common Assertions
```typescript
// URL validation
await expect(page).toHaveURL(/.*dashboard/);

// Text content
await expect(page.locator('text=Welcome')).toBeVisible();

// Element visibility
await expect(page.locator('[data-testid="button"]')).toBeVisible();

// Form validation
await expect(page.locator('text=required')).toBeVisible();

// File upload
await fileInput.setInputFiles('tests/fixtures/sample-id.jpg');
```

## 🚨 Error Handling

### Network Errors
- Simulated network failures
- Offline state testing
- Recovery scenarios

### Validation Errors
- Form validation testing
- File upload validation
- Business rule validation

### UI Errors
- Element not found
- Timeout scenarios
- Accessibility issues

## 📱 Mobile Testing

### Viewport Testing
- Responsive design validation
- Touch interaction testing
- Mobile-specific features

### Device Simulation
- Pixel 5 (Android)
- iPhone 12 (iOS)
- Various screen sizes

## 🔄 CI/CD Integration

### GitHub Actions
- Automated test execution
- Parallel test runs
- Artifact upload
- Test reporting

### Test Sharding
- Parallel execution
- Reduced execution time
- Resource optimization

## 🛠️ Debugging

### Debug Mode
```bash
npm run test:debug
```

### UI Mode
```bash
npm run test:ui
```

### Screenshots
- Automatic on failure
- Manual capture
- Visual regression testing

### Videos
- Recorded on failure
- Full test execution
- Performance analysis

## 📈 Performance Testing

### Load Testing
- Concurrent user simulation
- API endpoint testing
- Database performance

### Visual Performance
- Screenshot comparison
- Layout stability
- Animation performance

## 🔒 Security Testing

### Authentication
- Login flow testing
- Session management
- Biometric authentication

### Data Protection
- Sensitive data handling
- Encryption validation
- Privacy compliance

## 🌐 Internationalization

### Multi-language Support
- English (default)
- Shona (Zimbabwe)
- Localized content testing

### Currency Testing
- Multiple currency support
- Exchange rate validation
- Fee calculation accuracy

## 📋 Test Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Mobile tests validated
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] Accessibility compliance

### Post-deployment
- [ ] Smoke tests executed
- [ ] Critical path validation
- [ ] Error handling verified
- [ ] User feedback integration

## 🚀 Best Practices

### Test Organization
- Group related tests
- Use descriptive names
- Maintain test isolation
- Follow AAA pattern (Arrange, Act, Assert)

### Test Data
- Use unique identifiers
- Clean up test data
- Mock external services
- Use fixtures for consistency

### Performance
- Minimize test execution time
- Use parallel execution
- Optimize selectors
- Cache test data

### Maintenance
- Regular test updates
- Dependency management
- Documentation updates
- Test data refresh

## 📞 Support

For questions or issues with the test suite:

1. Check the test documentation
2. Review test logs and reports
3. Consult the Playwright documentation
4. Contact the development team

## 🔄 Continuous Improvement

### Regular Reviews
- Test coverage analysis
- Performance optimization
- New feature integration
- Bug regression testing

### Feedback Integration
- User journey updates
- Edge case discovery
- Performance bottlenecks
- Accessibility improvements 