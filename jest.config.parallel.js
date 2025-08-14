module.exports = {
  // Parallel execution configuration
  maxWorkers: '50%', // Use 50% of available CPU cores
  maxConcurrency: 10, // Maximum concurrent test suites
  
  // Test discovery
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test environment
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react',
        '@babel/preset-typescript'
      ]
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  
  // Test results processing
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],
  
  // Performance optimization
  bail: false, // Don't bail on first failure
  cache: true,
  cacheDirectory: '.jest-cache',
  
  // Test isolation
  isolateModules: true,
  
  // Environment variables
  setupFiles: ['<rootDir>/jest.env.js'],
  
  // Global test configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: {
        ignoreCodes: [151001]
      }
    }
  },
  
  // Test categorization
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: ['/node_modules/', '/integration/', '/e2e/']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/**/integration/**/*.test.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: ['/node_modules/', '/e2e/']
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/**/e2e/**/*.test.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: ['/node_modules/']
    }
  ],
  
  // Custom test runners for different types
  runner: '@jest/runner',
  
  // Test retry configuration
  retryTimes: 2,
  
  // Test sharding for parallel execution
  shard: process.env.JEST_SHARD ? {
    shardIndex: parseInt(process.env.JEST_SHARD_INDEX || '0'),
    totalShards: parseInt(process.env.JEST_SHARD || '1')
  } : undefined,
  
  // Performance monitoring
  detectOpenHandles: true,
  forceExit: true,
  
  // Test environment setup
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Module resolution for monorepo
  moduleDirectories: ['node_modules', 'src'],
  
  // Test file patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/.next/',
    '/.cache/'
  ],
  
  // Watch configuration
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/.next/',
    '/.cache/'
  ],
  
  // Snapshot configuration
  snapshotSerializers: ['@jest/snapshot-serializer-raw'],
  
  // Test data management
  testDataConsistencyCheck: true,
  
  // Error reporting
  errorOnDeprecated: true,
  
  // Test isolation
  injectGlobals: false,
  
  // Performance profiling
  logHeapUsage: process.env.NODE_ENV === 'test',
  
  // Test categorization by feature
  testNamePattern: process.env.TEST_PATTERN || '',
  
  // Coverage exclusions
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/.next/',
    '/.cache/',
    '/test-results/',
    '/playwright-report/'
  ],
  
  // Test result aggregation
  collectCoverage: process.env.COLLECT_COVERAGE === 'true',
  
  // Parallel test execution
  maxConcurrency: 10,
  
  // Test timeout per test
  testTimeout: 30000,
  
  // Setup and teardown
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  
  // Test environment variables
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  
  // Module transformation
  transformIgnorePatterns: [
    '/node_modules/(?!(lodash-es|@babel)/)'
  ],
  
  // Test result processing
  notify: true,
  notifyMode: 'always'
}; 