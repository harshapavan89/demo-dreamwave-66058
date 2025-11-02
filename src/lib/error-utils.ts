/**
 * Utility functions for safe error handling
 * Maps internal errors to user-friendly messages without exposing system details
 */

export function getSafeErrorMessage(error: any): string {
  // Handle authentication errors
  if (error.message?.toLowerCase().includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  
  if (error.message?.toLowerCase().includes('email already registered') || 
      error.message?.toLowerCase().includes('already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }
  
  if (error.message?.toLowerCase().includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  
  // Handle database errors
  if (error.code === '23505' || error.message?.includes('duplicate key')) {
    return 'This item already exists.';
  }
  
  if (error.code?.startsWith('23') || error.message?.includes('violates')) {
    return 'Unable to complete this operation. Please check your input.';
  }
  
  // Handle network errors
  if (error.message?.toLowerCase().includes('network') || 
      error.message?.toLowerCase().includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Handle rate limiting
  if (error.message?.toLowerCase().includes('rate limit') || 
      error.message?.toLowerCase().includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // Handle API errors generically
  if (error.message?.toLowerCase().includes('api')) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  // Default safe message
  return 'Something went wrong. Please try again.';
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  }
  
  return { valid: true, message: '' };
}

export function calculatePasswordStrength(password: string): number {
  let strength = 0;
  
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 20;
  if (password.length >= 16) strength += 10;
  
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9]/.test(password)) strength += 10;
  
  return Math.min(strength, 100);
}
