export enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
  HOTEL_MANAGER = 'HotelManager'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  preferredLanguage?: string;
  isActive?: boolean;
  fullName?: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstNam?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
}

export interface MinimalUser {
  firstName: string;
  lastName: string;
  roles: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string | null;
    expiresAt: string;
    user: {
      id: number;
      email: string;
      password: string | null;
      firstName: string;
      lastName: string;
      role: UserRole;
    };
  };
  errors: any;
  timestamp: string;
}


export interface RegisterResponse {
    success: boolean;
    message: string;
    roles?: UserRole;
    token?: string;
}
