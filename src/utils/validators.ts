/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Validate Indian phone number (10 digits, optionally prefixed with +91) */
export function isValidPhone(phone: string): boolean {
  return /^(\+91)?[6-9]\d{9}$/.test(phone.trim());
}

/** Validate OTP (6 digits) */
export function isValidOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp.trim());
}

/** Validate non-empty string */
export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/** Validate password — min 8 chars, at least one letter and one number */
export function isValidPassword(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

/** Validate attendance session code (6 alphanumeric chars) */
export function isValidSessionCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.trim().toUpperCase());
}
