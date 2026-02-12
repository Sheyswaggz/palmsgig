// Validation schemas for authentication forms
// Since zod is not available in package.json, implementing basic validation functions

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  acceptTerms: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface VerifyEmailFormData {
  code: string;
}

export interface VerifyPhoneFormData {
  code: string;
}

// Email validation
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

// Password validation
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

// Confirm password validation
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

// Full name validation
export const validateFullName = (fullName: string): string | null => {
  if (!fullName) {
    return 'Full name is required';
  }
  if (fullName.trim().length < 2) {
    return 'Full name must be at least 2 characters';
  }
  return null;
};

// Terms acceptance validation
export const validateTermsAcceptance = (accepted: boolean): string | null => {
  if (!accepted) {
    return 'You must accept the terms and conditions';
  }
  return null;
};

// OTP/Code validation
export const validateCode = (code: string): string | null => {
  if (!code) {
    return 'Verification code is required';
  }
  if (!/^[A-Z0-9]{6}$/i.test(code)) {
    return 'Verification code must be 6 characters';
  }
  return null;
};

// Phone validation
export const validatePhone = (phone: string): string | null => {
  if (!phone) {
    return 'Phone number is required';
  }
  // Basic phone validation - accepts formats like +1234567890 or (123) 456-7890
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Invalid phone number format';
  }
  return null;
};

// Validate login form
export const validateLoginForm = (data: LoginFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
};

// Validate register form
export const validateRegisterForm = (data: RegisterFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
  }

  const fullNameError = validateFullName(data.fullName);
  if (fullNameError) {
    errors.fullName = fullNameError;
  }

  const phoneError = validatePhone(data.phone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  const confirmPasswordError = validateConfirmPassword(data.password, data.confirmPassword);
  if (confirmPasswordError) {
    errors.confirmPassword = confirmPasswordError;
  }

  const termsError = validateTermsAcceptance(data.acceptTerms);
  if (termsError) {
    errors.acceptTerms = termsError;
  }

  return errors;
};

// Validate forgot password form
export const validateForgotPasswordForm = (
  data: ForgotPasswordFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
  }

  return errors;
};

// Validate verification code form
export const validateVerificationForm = (
  data: VerifyEmailFormData | VerifyPhoneFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const codeError = validateCode(data.code);
  if (codeError) {
    errors.code = codeError;
  }

  return errors;
};
