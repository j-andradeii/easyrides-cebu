/**
 * User Type Definitions
 *
 * TypeScript interfaces and types for user-related entities
 */

/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User roles
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

/**
 * Auth tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/**
 * Auth response
 */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

/**
 * User profile update data
 */
export interface UpdateUserProfileDto {
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}
