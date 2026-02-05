// Session code generation and validation

// Character set excluding ambiguous characters (0, O, I, 1, L)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a unique session code in the format XXXX-XXXX
 */
export const generateSessionCode = (): string => {
  const part1 = Array(4)
    .fill(0)
    .map(() => CHARSET[Math.floor(Math.random() * CHARSET.length)])
    .join('');
  const part2 = Array(4)
    .fill(0)
    .map(() => CHARSET[Math.floor(Math.random() * CHARSET.length)])
    .join('');
  return `${part1}-${part2}`;
};

/**
 * Validate session code format
 */
export const isValidSessionCodeFormat = (code: string): boolean => {
  const pattern = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
  return pattern.test(code.toUpperCase());
};

/**
 * Normalize session code (uppercase, add hyphen if needed)
 */
export const normalizeSessionCode = (code: string): string => {
  const cleaned = code.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return code.toUpperCase();
};
