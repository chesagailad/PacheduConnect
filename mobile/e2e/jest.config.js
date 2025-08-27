module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.js'],
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/e2e/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/e2e/tests/**/*.spec.{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: 'e2e/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true,
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}; 