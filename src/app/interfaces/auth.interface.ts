export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  role: {
    id: number;
    name: string;
    slug: string;
  };
  profilePhoto?: string;
  totalEvents?: number;
  totalCars?: number;
  totalVotes?: number;
  totalPhotos?: number;
  recentActivity?: any[];
}
 
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  passwordConfirm: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[] | null;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface VerificationCodeResponse {
  email: string;
}

export interface ValidationError {
  type: string;
  msg: string;
  path: string;
  location: string;
  value?: string;
}
