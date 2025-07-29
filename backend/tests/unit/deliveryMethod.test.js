/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: deliveryMethod.test - test file for backend functionality
 */

// Validation function extracted from the route for testing
function validateDeliveryMethod(deliveryMethod) {
  const supportedDeliveryMethods = ['bank_transfer', 'mobile_money', 'cash_pickup', 'home_delivery'];
  let validatedDeliveryMethod = 'bank_transfer'; // Default value
  
  if (deliveryMethod !== null && deliveryMethod !== undefined) {
    if (typeof deliveryMethod !== 'string' || deliveryMethod.trim() === '') {
      return {
        isValid: false,
        error: 'Invalid delivery method format. Delivery method must be a non-empty string.',
        field: 'deliveryMethod',
        received: deliveryMethod,
        supportedMethods: supportedDeliveryMethods
      };
    }
    
    const normalizedDeliveryMethod = deliveryMethod.toLowerCase().trim();
    if (!supportedDeliveryMethods.includes(normalizedDeliveryMethod)) {
      return {
        isValid: false,
        error: `Unsupported delivery method '${deliveryMethod}'. Please use one of the supported delivery methods.`,
        field: 'deliveryMethod',
        supportedMethods: supportedDeliveryMethods,
        received: deliveryMethod
      };
    }
    
    validatedDeliveryMethod = normalizedDeliveryMethod;
  }
  
  return {
    isValid: true,
    validatedDeliveryMethod
  };
}

describe('Delivery Method Validation Tests', () => {
  describe('Valid Delivery Methods', () => {
    test('should accept bank_transfer', () => {
      const result = validateDeliveryMethod('bank_transfer');
      expect(result.isValid).toBe(true);
      expect(result.validatedDeliveryMethod).toBe('bank_transfer');
    });

    test('should accept mobile_money', () => {
      const result = validateDeliveryMethod('mobile_money');
      expect(result.isValid).toBe(true);
      expect(result.validatedDeliveryMethod).toBe('mobile_money');
    });

    test('should accept cash_pickup', () => {
      const result = validateDeliveryMethod('cash_pickup');
      expect(result.isValid).toBe(true);
      expect(result.validatedDeliveryMethod).toBe('cash_pickup');
    });

    test('should accept home_delivery', () => {
      const result = validateDeliveryMethod('home_delivery');
      expect(result.isValid).toBe(true);
      expect(result.validatedDeliveryMethod).toBe('home_delivery');
    });
  });

  describe('Case Insensitive Validation', () => {
    test('should accept uppercase delivery method', () => {
      const result = validateDeliveryMethod('BANK_TRANSFER');
      expect(result.isValid).toBe(true);
      expect(result.validatedDeliveryMethod).toBe('bank_transfer');
    });

    test('should accept mixed case delivery method', () => {
      const result = validateDeliveryMethod('Mobile_Money');
      expect(result.isValid).toBe(true);
      expect(result.validatedDeliveryMethod).toBe('mobile_money');
    });

    test('should handle whitespace and normalize', () => {
      const result = validateDeliveryMethod('  cash_pickup  ');
      expect(result.isValid).toBe(true);
      expect(result.validatedDeliveryMethod).toBe('cash_pickup');
    });
  });

  describe('Invalid Delivery Methods', () => {
    test('should reject unsupported delivery method', () => {
      const result = validateDeliveryMethod('express_delivery');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported delivery method');
      expect(result.field).toBe('deliveryMethod');
      expect(result.supportedMethods).toEqual(['bank_transfer', 'mobile_money', 'cash_pickup', 'home_delivery']);
      expect(result.received).toBe('express_delivery');
    });

    test('should reject empty string', () => {
      const result = validateDeliveryMethod('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid delivery method format');
      expect(result.field).toBe('deliveryMethod');
    });

    test('should reject non-string value', () => {
      const result = validateDeliveryMethod(123);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid delivery method format');
      expect(result.field).toBe('deliveryMethod');
    });

    test('should reject whitespace-only string', () => {
      const result = validateDeliveryMethod('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid delivery method format');
      expect(result.field).toBe('deliveryMethod');
    });
  });

  describe('Default Behavior', () => {
    test('should return default when no delivery method provided', () => {
      const result = validateDeliveryMethod(null);
      expect(result.isValid).toBe(true);
      expect(result.validatedDeliveryMethod).toBe('bank_transfer');
    });

    test('should return default when undefined provided', () => {
      const result = validateDeliveryMethod(undefined);
      expect(result.isValid).toBe(true);
      expect(result.validatedDeliveryMethod).toBe('bank_transfer');
    });

    test('should return default when empty string provided', () => {
      const result = validateDeliveryMethod('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid delivery method format');
    });
  });

  describe('Supported Methods List', () => {
    test('should have correct supported delivery methods', () => {
      const result = validateDeliveryMethod('invalid_method');
      expect(result.supportedMethods).toEqual(['bank_transfer', 'mobile_money', 'cash_pickup', 'home_delivery']);
    });

    test('should validate all supported methods', () => {
      const supportedMethods = ['bank_transfer', 'mobile_money', 'cash_pickup', 'home_delivery'];
      
      supportedMethods.forEach(method => {
        const result = validateDeliveryMethod(method);
        expect(result.isValid).toBe(true);
        expect(result.validatedDeliveryMethod).toBe(method);
      });
    });
  });
}); 