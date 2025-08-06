export interface ResetRequestData {
  email: string;
}

export interface NewPasswordData {
  password: string;
  confirmPassword: string;
}

export interface PasswordResetToken {
  token: string;
  isValid: boolean;
  isExpired: boolean;
}