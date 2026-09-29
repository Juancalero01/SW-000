import { User } from './user.model';

export interface LoginDto {
  email: string;
  password?: string;
}


export interface VerifyEmailDto {
  email: string;
  token: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface TokenPayload {
  sub: number;
  email: string;
  roles?: string[];
  exp?: number;
  iat?: number;
}
