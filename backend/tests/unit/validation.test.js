const { SUPPORTED_CURRENCIES } = require('../../src/utils/exchangeRate');

// Validation functions extracted from the route
function validateCurrency(currency) {
  if (typeof currency !== 'string' || currency.trim() === '') {
    return {
      isValid: false,
      error: 'Invalid currency format. Currency must be a non-empty string.',
      field: 'currency',
      received: currency
    };
  }
  
  const normalizedCurrency = currency.toUpperCase().trim();
  if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
    return {
      isValid: false,
      error: `Unsupported currency '${currency}'. Please use one of the supported currencies.`,
      field: 'currency',
      supportedCurrencies: SUPPORTED_CURRENCIES,
      received: currency
    };
  }
  
  return {
    isValid: true,
    normalizedCurrency
  };
}

function validateRecipientId(recipientId) {
  if (typeof recipientId !== 'string' || recipientId.trim() === '') {
    return {
      isValid: false,
      error: 'Invalid recipient ID format. Recipient ID must be a valid UUID string.',
      field: 'recipientId',
      received: recipientId
    };
  }
  
  // UUID format validation (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(recipientId.trim())) {
    return {
      isValid: false,
      error: 'Invalid recipient ID format. Recipient ID must be a valid UUID.',
      field: 'recipientId',
      received: recipientId,
      expectedFormat: 'UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)'
    };
  }
  
  return {
    isValid: true,
    normalizedRecipientId: recipientId.trim()
  };
}

describe('Transaction Validation Tests', () => {
  describe('Currency Validation', () => {
    test('should accept valid supported currency', () => {
      const result = validateCurrency('USD');
      expect(result.isValid).toBe(true);
      expect(result.normalizedCurrency).toBe('USD');
    });

    test('should accept currency in lowercase and normalize it', () => {
      const result = validateCurrency('zar');
      expect(result.isValid).toBe(true);
      expect(result.normalizedCurrency).toBe('ZAR');
    });

    test('should reject unsupported currency', () => {
      const result = validateCurrency('EUR');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported currency');
      expect(result.field).toBe('currency');
      expect(result.supportedCurrencies).toEqual(SUPPORTED_CURRENCIES);
      expect(result.received).toBe('EUR');
    });

    test('should reject empty currency string', () => {
      const result = validateCurrency('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid currency format');
      expect(result.field).toBe('currency');
    });

    test('should reject non-string currency', () => {
      const result = validateCurrency(123);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid currency format');
      expect(result.field).toBe('currency');
    });

    test('should reject currency with only whitespace', () => {
      const result = validateCurrency('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid currency format');
      expect(result.field).toBe('currency');
    });

    test('should handle currency with extra whitespace', () => {
      const result = validateCurrency('  USD  ');
      expect(result.isValid).toBe(true);
      expect(result.normalizedCurrency).toBe('USD');
    });
  });

  describe('RecipientId Validation', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';

    test('should accept valid UUID format', () => {
      const result = validateRecipientId(validUUID);
      expect(result.isValid).toBe(true);
      expect(result.normalizedRecipientId).toBe(validUUID);
    });

    test('should reject invalid UUID format', () => {
      const result = validateRecipientId('invalid-uuid-format');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid recipient ID format');
      expect(result.field).toBe('recipientId');
      expect(result.expectedFormat).toContain('UUID');
    });

    test('should reject empty recipientId string', () => {
      const result = validateRecipientId('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid recipient ID format');
      expect(result.field).toBe('recipientId');
    });

    test('should reject non-string recipientId', () => {
      const result = validateRecipientId(123);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid recipient ID format');
      expect(result.field).toBe('recipientId');
    });

    test('should reject recipientId with only whitespace', () => {
      const result = validateRecipientId('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid recipient ID format');
      expect(result.field).toBe('recipientId');
    });

    test('should reject malformed UUID', () => {
      const result = validateRecipientId('123e4567-e89b-12d3-a456-42661417400'); // Missing character
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid recipient ID format');
      expect(result.field).toBe('recipientId');
    });

    test('should handle UUID with extra whitespace', () => {
      const result = validateRecipientId(`  ${validUUID}  `);
      expect(result.isValid).toBe(true);
      expect(result.normalizedRecipientId).toBe(validUUID);
    });

    test('should reject UUID with wrong version', () => {
      // UUID v4 should have version 4 (first digit of third group should be 4)
      const invalidVersionUUID = '123e4567-e89b-62d3-a456-426614174000';
      const result = validateRecipientId(invalidVersionUUID);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Supported Currencies', () => {
    test('should have expected supported currencies', () => {
      expect(SUPPORTED_CURRENCIES).toEqual(['ZAR', 'USD', 'MWK', 'MZN']);
    });

    test('should validate all supported currencies', () => {
      SUPPORTED_CURRENCIES.forEach(currency => {
        const result = validateCurrency(currency);
        expect(result.isValid).toBe(true);
        expect(result.normalizedCurrency).toBe(currency);
      });
    });
  });
}); 