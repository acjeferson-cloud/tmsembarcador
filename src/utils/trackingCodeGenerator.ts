/**
 * Generates a tracking code in the format: TGL-1-25-5DQ-0
 * 
 * Components:
 * - TGL: Establishment tracking prefix
 * - 1: Establishment code (removing leading zeros)
 * - 25: Last two digits of order year
 * - 5DQ: Order number in Base36
 * - 0: Check digit (Modulo 11)
 */

/**
 * Converts a number to Base36 (0-9, A-Z)
 */
function toBase36(num: number): string {
  return num.toString(36).toUpperCase();
}

/**
 * Calculates check digit using Modulo 11 algorithm
 */
function calculateCheckDigit(input: string): string {
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  
  // Remove hyphens and process each character
  const cleanInput = input.replace(/-/g, '');
  
  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i];
    let value: number;
    
    if (char >= '0' && char <= '9') {
      value = parseInt(char);
    } else if (char >= 'A' && char <= 'Z') {
      value = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    } else {
      value = 0;
    }
    
    sum += value * weights[i % weights.length];
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;
  
  return checkDigit.toString();
}

/**
 * Extracts numeric part from order number (removes PED- prefix)
 */
function extractOrderNumber(orderNumber: string): number {
  const numericPart = orderNumber.replace(/^PED-/, '');
  return parseInt(numericPart, 10);
}

/**
 * Removes leading zeros from establishment code
 */
function formatEstablishmentCode(code: string): string {
  return parseInt(code, 10).toString();
}

/**
 * Gets the last two digits of the year from a date
 */
function getYearSuffix(date: Date): string {
  return date.getFullYear().toString().slice(-2);
}

/**
 * Generates tracking code for an order
 */
export function generateTrackingCode(
  orderNumber: string,
  orderDate: Date,
  establishmentCode: string = '0001',
  establishmentPrefix: string = 'TGL'
): string {
  // Extract numeric order number
  const numericOrderNumber = extractOrderNumber(orderNumber);
  
  // Format establishment code (remove leading zeros)
  const formattedEstablishmentCode = formatEstablishmentCode(establishmentCode);
  
  // Get year suffix
  const yearSuffix = getYearSuffix(orderDate);
  
  // Convert order number to Base36
  const base36OrderNumber = toBase36(numericOrderNumber);
  
  // Build the code without check digit
  const codeWithoutCheckDigit = `${establishmentPrefix}-${formattedEstablishmentCode}-${yearSuffix}-${base36OrderNumber}`;
  
  // Calculate check digit
  const checkDigit = calculateCheckDigit(codeWithoutCheckDigit);
  
  // Return complete tracking code
  return `${codeWithoutCheckDigit}-${checkDigit}`;
}

/**
 * Validates a tracking code format
 */
function validateTrackingCode(trackingCode: string): boolean {
  const pattern = /^[A-Z]{2,4}-\d+-\d{2}-[0-9A-Z]+-\d$/;
  return pattern.test(trackingCode);
}

/**
 * Parses a tracking code into its components
 */
function parseTrackingCode(trackingCode: string): {
  prefix: string;
  establishmentCode: string;
  year: string;
  orderNumber: string;
  checkDigit: string;
} | null {
  const parts = trackingCode.split('-');
  
  if (parts.length !== 5) {
    return null;
  }
  
  return {
    prefix: parts[0],
    establishmentCode: parts[1],
    year: parts[2],
    orderNumber: parts[3],
    checkDigit: parts[4]
  };
}