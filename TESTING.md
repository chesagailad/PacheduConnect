# Testing Guide for PacheduConnect

This document outlines the comprehensive testing strategy implemented for the PacheduConnect monorepo.

## Overview

Our testing strategy includes:
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test API endpoints and component interactions
- **End-to-End Tests**: Test complete user workflows
- **Security Tests**: Vulnerability scanning and audit
- **Performance Tests**: Load testing and Lighthouse CI

## Test Structure

```
├── backend/
│   ├── tests/
│   │   ├── setup.js                 # Test configuration
│   │   ├── fixtures/                # Test data
│   │   ├── unit/                    # Unit tests
│   │   │   ├── models/              # Model tests
│   │   │   ├── utils/               # Utility tests
│   │   │   └── services/            # Service tests
│   │   └── integration/             # API endpoint tests
│   └── jest.config.js
├── frontend/
│   ├── src/components/__tests__/    # Component tests
│   ├── jest.config.js
│   └── jest.setup.js
├── mobile/
│   ├── src/screens/__tests__/       # Screen tests
│   ├── jest.config.js
│   └── jest.setup.js
└── e2e/
    ├── tests/                       # E2E test files
    └── playwright.config.js         # Playwright configuration
```

## Running Tests

### All Tests
```bash
npm test                    # Run all unit tests
npm run test:coverage       # Run all tests with coverage
npm run test:watch          # Watch mode for development
```

### Backend Tests
```bash
cd backend
npm test                    # Unit and integration tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                    # Component tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

### Mobile Tests
```bash
cd mobile
npm test                    # React Native component tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

### End-to-End Tests
```bash
npm run e2e                 # Run E2E tests
npm run e2e:ui              # Run with Playwright UI
npm run e2e:debug           # Debug mode
npm run e2e:report          # View test report
```

## Test Coverage

We maintain a minimum coverage threshold of 70% across:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Viewing Coverage Reports
```bash
# After running tests with coverage
open backend/coverage/index.html
open frontend/coverage/index.html
open mobile/coverage/index.html
```

## Backend Testing

### Unit Tests
Located in `backend/tests/unit/`:
- **Models**: Test Sequelize model validation, relationships, and methods
- **Utils**: Test utility functions like fee calculation, exchange rates
- **Services**: Test external service integrations (SMS, payments)

### Integration Tests
Located in `backend/tests/integration/`:
- **API Endpoints**: Test complete request/response cycles
- **Authentication**: Test login, registration, JWT handling
- **Database Operations**: Test CRUD operations with real database

### Example Test Structure
```javascript
// backend/tests/unit/models/User.test.js
describe('User Model', () => {
  describe('Validation', () => {
    test('should create user with valid data', async () => {
      // Test implementation
    });
    
    test('should validate email format', async () => {
      // Test implementation
    });
  });
});
```

## Frontend Testing

### Component Tests
- Test React components in isolation
- Mock external dependencies (APIs, routing)
- Test user interactions and accessibility
- Verify proper rendering and state management

### Example Component Test
```javascript
// frontend/src/components/__tests__/PaymentProcessor.test.tsx
describe('PaymentProcessor Component', () => {
  test('processes successful payment', async () => {
    render(<PaymentProcessor {...props} />);
    // Test user interactions
    // Verify API calls
    // Check success states
  });
});
```

## Mobile Testing

### Screen Tests
- Test React Native screens with @testing-library/react-native
- Mock navigation and external services
- Test form validation and user flows
- Verify accessibility features

### Example Screen Test
```javascript
// mobile/src/screens/__tests__/SendMoneyScreen.test.tsx
describe('SendMoneyScreen', () => {
  test('completes send money flow', async () => {
    renderWithProviders(<SendMoneyScreen />);
    // Test form interactions
    // Verify navigation calls
    // Check validation states
  });
});
```

## End-to-End Testing

### Test Scenarios
Our E2E tests cover critical user journeys:
- **Authentication**: Registration, login, logout
- **Send Money**: Complete transaction flow
- **Recipient Management**: Add, edit recipients
- **Payment Processing**: Multiple payment methods
- **Error Handling**: Network failures, validation errors

### Test Data Management
- Tests use isolated test database
- Data is seeded before test runs
- Each test has clean database state

## Continuous Integration

### GitHub Actions Pipeline
Our CI/CD pipeline includes:

1. **Unit Tests**: All workspaces run unit tests in parallel
2. **Security Scan**: Vulnerability auditing and CodeQL analysis
3. **E2E Tests**: Full application testing after unit tests pass
4. **Performance Tests**: Lighthouse CI and load testing (production only)
5. **Deployment**: Automatic deployment on successful tests

### Pipeline Stages
```yaml
jobs:
  backend-tests:     # API unit and integration tests
  frontend-tests:    # React component tests
  mobile-tests:      # React Native tests
  security-scan:     # Security vulnerability scanning
  e2e-tests:         # End-to-end testing
  performance-tests: # Performance and load testing
  deploy-staging:    # Deploy to staging environment
  deploy-production: # Deploy to production environment
```

## Test Environment Setup

### Prerequisites
```bash
# Install dependencies
npm run install:all

# Setup test databases
npm run db:migrate
npm run db:seed
```

### Environment Variables
Create `.env.test` files in each workspace with test-specific configurations:
- Test database connections
- Mock API keys
- Test payment gateway credentials

## Mocking Strategy

### Backend Mocks
- **External APIs**: SMS service, payment gateways, exchange rates
- **Database**: Use SQLite in-memory for fast tests
- **Redis**: In-memory mock implementation

### Frontend/Mobile Mocks
- **API Calls**: Mock axios requests
- **Navigation**: Mock React Navigation
- **External Services**: Mock authentication, notifications
- **Browser APIs**: localStorage, sessionStorage, window objects

## Best Practices

### Writing Tests
1. **Test Behavior, Not Implementation**: Focus on what the code does, not how
2. **Use Descriptive Names**: Test names should clearly describe the scenario
3. **Follow AAA Pattern**: Arrange, Act, Assert
4. **Keep Tests Independent**: Each test should work in isolation
5. **Use Factories**: Create test data with factory functions

### Test Organization
1. **Group Related Tests**: Use `describe` blocks to organize tests
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Setup and Teardown**: Use `beforeEach`/`afterEach` for test preparation
4. **Consistent Structure**: Follow the same test structure across the codebase

### Performance
1. **Parallel Execution**: Tests run in parallel where possible
2. **Fast Feedback**: Unit tests run quickly for rapid development
3. **Selective Testing**: Use watch mode during development
4. **Efficient Mocking**: Mock expensive operations

## Debugging Tests

### Backend
```bash
cd backend
npm run test:watch           # Watch mode for rapid feedback
npm test -- --verbose        # Detailed test output
npm test -- --detectOpenHandles  # Debug hanging tests
```

### Frontend
```bash
cd frontend
npm run test:watch           # Interactive watch mode
npm test -- --verbose        # Detailed output
```

### E2E Tests
```bash
npm run e2e:debug           # Step through tests with debugger
npm run e2e:ui              # Visual test runner
```

## Coverage Reports

### Generating Reports
```bash
npm run test:coverage       # Generate coverage for all workspaces
```

### Coverage Thresholds
Each workspace maintains 70% minimum coverage:
- New code should have higher coverage
- Critical paths (authentication, payments) require near 100%
- Utility functions and models should be fully tested

### Monitoring
- Coverage reports are uploaded to Codecov in CI
- PRs show coverage changes
- Failing coverage blocks deployment

## Security Testing

### Automated Scans
- **Dependency Audit**: `npm audit` checks for known vulnerabilities
- **CodeQL**: GitHub's semantic code analysis
- **Security Headers**: Test proper security header implementation

### Manual Testing
- **Authentication**: Test JWT handling, session management
- **Authorization**: Verify access controls
- **Input Validation**: Test injection attacks, XSS prevention

## Performance Testing

### Load Testing
- **Artillery**: API load testing for backend endpoints
- **Concurrent Users**: Test system under realistic load
- **Response Times**: Monitor API performance under stress

### Frontend Performance
- **Lighthouse CI**: Automated performance auditing
- **Bundle Analysis**: Monitor JavaScript bundle sizes
- **Core Web Vitals**: Track user experience metrics

## Contributing

### Adding New Tests
1. Follow existing test patterns and structure
2. Add tests for any new features or bug fixes
3. Ensure new tests pass in CI environment
4. Update this documentation for new test categories

### Test Review Process
1. All PRs must maintain or improve test coverage
2. New features require comprehensive test coverage
3. Bug fixes should include regression tests
4. E2E tests should be added for new user workflows

## Troubleshooting

### Common Issues

**Tests failing in CI but passing locally:**
- Check environment differences
- Verify test database setup
- Check for timing issues in async tests

**Flaky E2E tests:**
- Add proper waits for elements
- Use data-testid attributes for reliable selectors
- Check for race conditions

**Low coverage warnings:**
- Add tests for uncovered branches
- Test error scenarios and edge cases
- Remove dead code or add explanatory comments

### Getting Help
- Check existing tests for patterns
- Review test documentation
- Ask team members for guidance
- Create issues for test infrastructure problems

## Maintenance

### Regular Tasks
- Update test dependencies monthly
- Review and update test data fixtures
- Analyze slow tests and optimize
- Clean up obsolete or redundant tests
- Monitor coverage trends and address declines

### Test Infrastructure
- Keep testing tools and frameworks updated
- Maintain CI/CD pipeline efficiency
- Monitor test execution times
- Update browser versions for E2E tests