import { describe, it, expect } from 'vitest';
import { generateTrackingCode, validateTrackingCode, parseTrackingCode } from '../trackingCodeGenerator';

describe('trackingCodeGenerator', () => {
  describe('generateTrackingCode', () => {
    it('should generate correct tracking code for order 6974', () => {
      const orderDate = new Date('2025-12-26');
      const result = generateTrackingCode('PED-6974', orderDate, '0001', 'TGL');
      
      // Order 6974 in base36 is 5DQ
      expect(result).toBe('TGL-1-25-5DQ-0');
    });

    it('should generate correct tracking code for order 9622', () => {
      const orderDate = new Date('2025-12-26');
      const result = generateTrackingCode('PED-9622', orderDate, '0001', 'TGL');
      
      // Order 9622 in base36 is 7EE
      expect(result).toBe('TGL-1-25-7EE-6');
    });

    it('should handle different establishment codes', () => {
      const orderDate = new Date('2025-12-26');
      const result = generateTrackingCode('PED-6974', orderDate, '0005', 'TGL');
      
      expect(result).toBe('TGL-5-25-5DQ-4');
    });

    it('should handle different prefixes', () => {
      const orderDate = new Date('2025-12-26');
      const result = generateTrackingCode('PED-6974', orderDate, '0001', 'ABC');
      
      expect(result).toBe('ABC-1-25-5DQ-7');
    });

    it('should handle different years', () => {
      const orderDate = new Date('2024-12-26');
      const result = generateTrackingCode('PED-6974', orderDate, '0001', 'TGL');
      
      expect(result).toBe('TGL-1-24-5DQ-9');
    });

    it('should handle order numbers without PED- prefix', () => {
      const orderDate = new Date('2025-12-26');
      const result = generateTrackingCode('6974', orderDate, '0001', 'TGL');
      
      expect(result).toBe('TGL-1-25-5DQ-0');
    });
  });

  describe('validateTrackingCode', () => {
    it('should validate correct tracking codes', () => {
      expect(validateTrackingCode('TGL-1-25-5DQ-0')).toBe(true);
      expect(validateTrackingCode('ABC-5-24-7EE-6')).toBe(true);
    });

    it('should reject invalid tracking codes', () => {
      expect(validateTrackingCode('TGL-1-25-5DQ')).toBe(false); // Missing check digit
      expect(validateTrackingCode('TGL-1-5DQ-0')).toBe(false); // Missing year
      expect(validateTrackingCode('TGL-25-5DQ-0')).toBe(false); // Missing establishment code
      expect(validateTrackingCode('invalid')).toBe(false);
    });
  });

  describe('parseTrackingCode', () => {
    it('should parse valid tracking codes', () => {
      const result = parseTrackingCode('TGL-1-25-5DQ-0');
      
      expect(result).toEqual({
        prefix: 'TGL',
        establishmentCode: '1',
        year: '25',
        orderNumber: '5DQ',
        checkDigit: '0'
      });
    });

    it('should return null for invalid tracking codes', () => {
      expect(parseTrackingCode('invalid')).toBeNull();
      expect(parseTrackingCode('TGL-1-25-5DQ')).toBeNull();
    });
  });
});