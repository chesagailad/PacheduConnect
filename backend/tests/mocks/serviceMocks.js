/**
 * Service Mocks for Testing
 */

// Mock PCI Compliance Service
const mockPCIService = {
  encryptSensitiveData: jest.fn((data) => ({
    encrypted: true,
    data: 'encrypted-data',
    iv: 'test-iv'
  })),
  decryptSensitiveData: jest.fn((encryptedData) => ({
    decrypted: true,
    data: 'decrypted-data'
  })),
  maskSensitiveData: jest.fn((data) => ({
    creditCard: '4111********1111',
    ssn: '123-**-6789',
    phone: '+12-***-7890',
    email: 't***@example.com'
  }))
};

// Mock Security Monitoring Service
const mockSecurityMonitoring = {
  performHealthCheck: jest.fn(() => ({
    status: 'healthy',
    metrics: { uptime: 100, errors: 0 },
    timestamp: new Date().toISOString()
  })),
  detectThreats: jest.fn(() => []),
  logSecurityEvent: jest.fn()
};

// Mock MFA Service
const mockMFAService = {
  generateTOTPSecret: jest.fn(() => ({
    secret: 'test-secret',
    otpauthUrl: 'otpauth://totp/test'
  })),
  generateQRCode: jest.fn(() => 'data:image/png;base64,test-qr-code'),
  generateBackupCodes: jest.fn(() => ['code1', 'code2', 'code3']),
  verifyTOTPToken: jest.fn(() => true),
  verifyBackupCode: jest.fn(() => true)
};

// Mock Token Service
const mockTokenService = {
  generateTokens: jest.fn(() => ({
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  })),
  refreshAccessToken: jest.fn(() => ({
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  })),
  blacklistToken: jest.fn(),
  verifyToken: jest.fn(() => ({ valid: true, payload: { userId: 'test-user' } }))
};

module.exports = {
  mockPCIService,
  mockSecurityMonitoring,
  mockMFAService,
  mockTokenService
};
