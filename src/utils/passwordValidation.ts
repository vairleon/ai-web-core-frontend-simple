export function validatePassword(password: string): {
  isValid: boolean;
  score: number;
  message: string;
} {
  if (!password) {
    return { isValid: false, score: 0, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, score: 0, message: 'Password must be at least 8 characters' };
  }

  if (password.length > 20) {
    return { isValid: false, score: 0, message: 'Password must be less then 20 characters' };
  }

  let strengthCount = 0;
  let details = [];

  if (/[A-Z]/.test(password)) {
    strengthCount++;
    details.push('uppercase');
  }
  if (/[a-z]/.test(password)) {
    strengthCount++;
    details.push('lowercase');
  }
  if (/[0-9]/.test(password)) {
    strengthCount++;
    details.push('numbers');
  }
  if (/[^A-Za-z0-9]/.test(password)) {
    strengthCount++;
    details.push('special characters');
  }

  const score = Math.min(100, (strengthCount / 4) * 100);
  
  return {
    isValid: strengthCount >= 2,
    score,
    message: strengthCount < 2 
      ? `Password must contain at least 2 of: uppercase, lowercase, numbers, special characters` 
      : `Password strength: ${score}% (contains ${details.join(', ')})`
  };
}